/**
 * store.js — لایه‌ی ذخیره‌سازی Chop (نسخه‌ی درون‌حافظه‌ای + پایداری روی فایل)
 *
 * این نسخه از Redis استفاده نمی‌کند. داده‌ها در حافظه‌ی پروسه نگه داشته
 * می‌شوند و هر چند ثانیه روی یک فایل JSON ذخیره می‌شوند تا بعد از ریستارت
 * پروسه (یا دیپلوی مجدد روی Railway با volume mount) دیتا از بین نرود.
 *
 * متدها و امضاهای این کلاس عمداً با نسخه‌ی قبلی (Redis) یکسان هستند تا
 * index.js، bot.js و wsrelay.js بدون هیچ تغییری کار کنند.
 *
 * برای پایداری داده‌ها روی Railway:
 *   - یک Volume Mount به مسیر `/data` بسازید و `DATA_FILE=/data/chop-data.json` ست کنید.
 *   - اگر `DATA_FILE` ست نشود، از `chop-data.json` در پوشه‌ی جاری استفاده می‌کند
 *     (روی Railway بدون volume، این فایل با هر ریستارت ریست می‌شود).
 */
import fs from "node:fs";
import path from "node:path";

const LOG_MAX_ALL = 1000;
const ONLINE_TTL_SECONDS = 120;
const ONLINE_ACTIVE_WINDOW = 90;
const CONFIG_CACHE_MS = 5000;
const PERSIST_PATH =
  process.env.DATA_FILE ||
  path.join(process.cwd(), "chop-data.json");
const PERSIST_INTERVAL_MS = 4000; // هر ۴ ثانیه اگر dirty باشد flush می‌کنیم
const PERSIST_DEBOUNCE_MS = 1500; // حداقل فاصله‌ی بین دو flush

function newId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

// شبیه‌سازی auto-pipelining برای حفظ همان اینترفیس Promise-based
const tick = () => new Promise((r) => setTimeout(r, 0));

export class ChopStore {
  constructor() {
    this._cfgCache = new Map();
    this._dirty = false;
    this._lastFlush = 0;
    this._flushTimer = null;
    this._data = {
      configs: {},        // id -> config object
      usage: {},          // id -> bytes (number)
      uuidx: {},          // uuid -> id
      traffic: {},        // bucket (string) -> bytes (number)
      online: {},         // "configId:ip" -> timestamp (seconds)
      logall: [],         // array of log entries (newest first)
      bot_settings: { token: "", enabled: false, secret: "" },
      bot_admins: {},     // tgId -> admin object
      bot_members: {},    // tgId -> member object
      bot_pending: {},    // tgId -> pending object
      settings: {},       // generic key -> string value
      reqcount: {},       // "YYYY-MM-DD" -> number
    };
    this._load();
    // تایمر دوره‌ای flush
    try {
      setInterval(() => this._maybeFlush(), PERSIST_INTERVAL_MS).unref();
    } catch { /* در محیط‌هایی بدون setInterval این خط نادیده گرفته می‌شود */ }
    // موقع خاموش‌شدن پروسه، فایل رو sync بنویس تا دیتا از دست نره
    for (const sig of ["SIGTERM", "SIGINT", "beforeExit"]) {
      try {
        process.on(sig, () => {
          this._flushSync();
          if (sig === "SIGINT") process.exit(0);
        });
      } catch { /* ignore */ }
    }
  }

  // ─── persistence ──────────────────────────────────────────────────
  _load() {
    try {
      if (!fs.existsSync(PERSIST_PATH)) return;
      const raw = fs.readFileSync(PERSIST_PATH, "utf8");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      // merge با پیش‌فرض‌ها (تا فایل‌های قدیمی که فیلد کم دارن هم کار کنن)
      Object.assign(this._data, {
        configs: parsed.configs || {},
        usage: parsed.usage || {},
        uuidx: parsed.uuidx || {},
        traffic: parsed.traffic || {},
        online: {}, // online حالت زنده‌ست، از فایل ریستور نمی‌شه
        logall: Array.isArray(parsed.logall) ? parsed.logall : [],
        bot_settings: { token: "", enabled: false, secret: "", ...(parsed.bot_settings || {}) },
        bot_admins: parsed.bot_admins || {},
        bot_members: parsed.bot_members || {},
        bot_pending: parsed.bot_pending || {},
        settings: parsed.settings || {},
        reqcount: parsed.reqcount || {},
      });
      // پاک‌سازی lazy ورودی‌های قدیمی traffic (بیشتر از ۷۲ ساعت)
      const cutoff = Math.floor(Date.now() / 1000) - 72 * 3600;
      for (const bucket of Object.keys(this._data.traffic)) {
        if (Number(bucket) < cutoff) delete this._data.traffic[bucket];
      }
      // trim logall
      if (this._data.logall.length > LOG_MAX_ALL) {
        this._data.logall = this._data.logall.slice(0, LOG_MAX_ALL);
      }
    } catch (e) {
      console.error("store: load failed:", e && e.message);
    }
  }

  _markDirty() {
    this._dirty = true;
    // schedule flush زودتر از تایمر دوره‌ای
    if (this._flushTimer) return;
    const t = setTimeout(() => {
      this._flushTimer = null;
      this._maybeFlush();
    }, PERSIST_DEBOUNCE_MS);
    // unref تا تایمر، پروسه رو زنده نگه نداره (در حالت idle)
    if (typeof t.unref === "function") t.unref();
    this._flushTimer = t;
  }

  _maybeFlush() {
    if (!this._dirty) return;
    const now = Date.now();
    if (now - this._lastFlush < PERSIST_DEBOUNCE_MS) return;
    this._flushSync();
  }

  _flushSync() {
    if (!this._dirty) return;
    try {
      // مطمئن شو دایرکتوریِ مسیر فایل وجود داره (برای Volume Mount های تازه)
      const dir = path.dirname(PERSIST_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmpPath = PERSIST_PATH + ".tmp";
      fs.writeFileSync(tmpPath, JSON.stringify(this._data), "utf8");
      fs.renameSync(tmpPath, PERSIST_PATH); // atomic
      this._dirty = false;
      this._lastFlush = Date.now();
    } catch (e) {
      console.error("store: flush failed:", e && e.message);
    }
  }

  // ---------------------------------------------------------------- configs
  async listConfigs() {
    await tick();
    const all = Object.values(this._data.configs);
    const out = all.map((cfg) => ({ ...cfg, used_bytes: this._data.usage[cfg.id] || 0 }));
    out.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    return out;
  }

  async getConfig(id) {
    await tick();
    const raw = this._data.configs[id];
    if (!raw) return null;
    return { ...raw, used_bytes: this._data.usage[id] || 0 };
  }

  async getConfigByUuid(uuid) {
    await tick();
    const cached = this._cfgCache.get(uuid);
    if (cached && Date.now() - cached.ts < CONFIG_CACHE_MS) return cached.value;
    let id = this._data.uuidx[uuid];
    if (!id) {
      // fallback + self-heal
      for (const [cid, cfg] of Object.entries(this._data.configs)) {
        if (cfg.uuid === uuid) {
          id = cid;
          this._data.uuidx[uuid] = cid;
          this._markDirty();
          break;
        }
      }
    }
    if (!id) {
      this._cfgCache.set(uuid, { value: null, ts: Date.now() });
      return null;
    }
    const cfg = await this.getConfig(id);
    if (cfg && cfg.uuid === uuid) {
      this._cfgCache.set(uuid, { value: cfg, ts: Date.now() });
      return cfg;
    }
    this._cfgCache.set(uuid, { value: null, ts: Date.now() });
    return null;
  }

  async saveConfig(config) {
    await tick();
    this._data.configs[config.id] = { ...config };
    delete this._data.configs[config.id].used_bytes; // فیلد مشتق
    if (config.uuid) {
      this._data.uuidx[config.uuid] = config.id;
    }
    if (config.uuid) this._cfgCache.delete(config.uuid);
    this._markDirty();
    return true;
  }

  async deleteConfig(id) {
    await tick();
    const existing = this._data.configs[id];
    delete this._data.configs[id];
    delete this._data.usage[id];
    delete this._data.uuidx[existing?.uuid || ""];
    if (existing?.uuid) this._cfgCache.delete(existing.uuid);
    // پاک‌کردن ورودی‌های online مربوط به همین configId
    const prefix = `${id}:`;
    for (const key of Object.keys(this._data.online)) {
      if (key.startsWith(prefix)) delete this._data.online[key];
    }
    this._markDirty();
    return true;
  }

  async resetUsage(id) {
    await tick();
    delete this._data.usage[id];
    this._markDirty();
    return true;
  }

  async getUsage(id) {
    await tick();
    return this._data.usage[id] || 0;
  }

  async bumpUsage(id, amount) {
    await tick();
    this._data.usage[id] = (this._data.usage[id] || 0) + amount;
    this._markDirty();
    return this._data.usage[id];
  }

  // ---------------------------------------------------------------- traffic
  async recordTrafficBucket(nbytes) {
    await tick();
    const bucket = Math.floor(Date.now() / 1000 / 3600) * 3600;
    this._data.traffic[String(bucket)] = (this._data.traffic[String(bucket)] || 0) + nbytes;
    // پاک‌سازی ورودی‌های قدیمی‌تر از ۷۲ ساعت
    const cutoff = Math.floor(Date.now() / 1000) - 72 * 3600;
    for (const b of Object.keys(this._data.traffic)) {
      if (Number(b) < cutoff) delete this._data.traffic[b];
    }
    this._markDirty();
    return true;
  }

  async getTrafficSeries(hours = 24) {
    await tick();
    const nowSec = Math.floor(Date.now() / 1000);
    const nowBucket = Math.floor(nowSec / 3600) * 3600;
    const buckets = [];
    for (let i = hours - 1; i >= 0; i--) buckets.push(String(nowBucket - i * 3600));
    return buckets.map((bucket) => ({ hour: Number(bucket), bytes: this._data.traffic[bucket] || 0 }));
  }

  // ------------------------------------------------------------------ online
  async markOnline(configId, clientIp) {
    await tick();
    this._data.online[`${configId}:${clientIp}`] = Date.now() / 1000;
    // پاک‌سازی ورودی‌های قدیمی (هر بار که مارک می‌کنیم، یک‌بار housekeeping)
    const cutoff = Date.now() / 1000 - ONLINE_TTL_SECONDS;
    for (const [key, ts] of Object.entries(this._data.online)) {
      if (ts < cutoff) delete this._data.online[key];
    }
    return true;
  }

  async markOffline(configId, clientIp) {
    await tick();
    delete this._data.online[`${configId}:${clientIp}`];
    return true;
  }

  async _activeOnlineMembers(configId) {
    await tick();
    const now = Date.now() / 1000;
    const cutoff = now - ONLINE_TTL_SECONDS;
    const activeWindow = now - ONLINE_ACTIVE_WINDOW;
    const prefix = `${configId}:`;
    const out = [];
    for (const [key, ts] of Object.entries(this._data.online)) {
      if (ts < cutoff) { delete this._data.online[key]; continue; }
      if (ts < activeWindow) continue;
      if (key.startsWith(prefix)) out.push(key.slice(prefix.length));
    }
    return out;
  }

  async onlineIpCount(configId) {
    const ips = await this._activeOnlineMembers(configId);
    return new Set(ips).size;
  }

  async onlineIpCountsForAll() {
    await tick();
    const now = Date.now() / 1000;
    const cutoff = now - ONLINE_TTL_SECONDS;
    const activeWindow = now - ONLINE_ACTIVE_WINDOW;
    const counts = {};
    const uniq = new Set();
    for (const [key, ts] of Object.entries(this._data.online)) {
      if (ts < cutoff) { delete this._data.online[key]; continue; }
      if (ts < activeWindow) continue;
      if (uniq.has(key)) continue;
      uniq.add(key);
      const sep = key.indexOf(":");
      if (sep === -1) continue;
      const cid = key.slice(0, sep);
      counts[cid] = (counts[cid] || 0) + 1;
    }
    return counts;
  }

  async isIpWithinLimit(config, clientIp) {
    const limit = config.ip_limit || 0;
    if (!limit) return true;
    const ips = await this._activeOnlineMembers(config.id);
    const set = new Set(ips);
    return set.has(clientIp) || set.size < limit;
  }

  // -------------------------------------------------------------------- logs
  async logConnection(configId, configName, clientIp, address, port, nbytes) {
    await tick();
    const entry = {
      config_id: configId,
      config_name: configName,
      ip: clientIp,
      address,
      port,
      bytes: nbytes,
      ts: Date.now() / 1000,
    };
    this._data.logall.unshift(entry);
    if (this._data.logall.length > LOG_MAX_ALL) {
      this._data.logall.length = LOG_MAX_ALL;
    }
    this._markDirty();
    return true;
  }

  async getLogs(configId, limit = 100) {
    await tick();
    if (!configId) {
      return this._data.logall.slice(0, limit);
    }
    const out = [];
    for (const entry of this._data.logall) {
      if (entry.config_id === configId) {
        out.push(entry);
        if (out.length >= limit) break;
      }
    }
    return out;
  }

  // --------------------------------------------------------------- bot config
  async getBotSettings() {
    await tick();
    return {
      token: this._data.bot_settings.token || "",
      enabled: !!this._data.bot_settings.enabled,
      secret: this._data.bot_settings.secret || "",
    };
  }

  async saveBotSettings(token, enabled, secret) {
    await tick();
    this._data.bot_settings = {
      token: token || "",
      enabled: !!enabled,
      secret: secret || "",
    };
    this._markDirty();
    return true;
  }

  async listBotAdmins() {
    await tick();
    const admins = Object.values(this._data.bot_admins);
    admins.sort((a, b) => (a.added_at || 0) - (b.added_at || 0));
    return admins;
  }

  async isBotAdmin(tgId) {
    await tick();
    return !!this._data.bot_admins[String(tgId)];
  }

  async addBotAdmin(tgId, addedBy = "") {
    await tick();
    this._data.bot_admins[String(tgId)] = {
      id: String(tgId),
      added_at: Date.now() / 1000,
      added_by: addedBy,
    };
    this._markDirty();
    return true;
  }

  async removeBotAdmin(tgId) {
    await tick();
    delete this._data.bot_admins[String(tgId)];
    this._markDirty();
    return true;
  }

  async upsertBotMember(tgId, username, firstName) {
    await tick();
    const key = String(tgId);
    const now = Date.now() / 1000;
    const existing = this._data.bot_members[key];
    this._data.bot_members[key] = existing
      ? { ...existing, username, first_name: firstName, last_seen: now }
      : { id: key, username, first_name: firstName, joined_at: now, last_seen: now };
    this._markDirty();
    return true;
  }

  async listBotMembers() {
    await tick();
    const members = Object.values(this._data.bot_members);
    members.sort((a, b) => (b.last_seen || 0) - (a.last_seen || 0));
    return members;
  }

  async removeBotMember(tgId) {
    await tick();
    delete this._data.bot_members[String(tgId)];
    this._markDirty();
    return true;
  }

  async setBotPending(tgId, data) {
    await tick();
    this._data.bot_pending[String(tgId)] = data;
    this._markDirty();
    return true;
  }

  async getBotPending(tgId) {
    await tick();
    return this._data.bot_pending[String(tgId)] || null;
  }

  async clearBotPending(tgId) {
    await tick();
    delete this._data.bot_pending[String(tgId)];
    this._markDirty();
    return true;
  }

  // ------------------------------------------------------------------ settings (generic key/value)
  async getSetting(key) {
    await tick();
    const v = this._data.settings[key];
    return v === undefined || v === null ? null : v;
  }

  async setSetting(key, value) {
    await tick();
    this._data.settings[key] = String(value);
    this._markDirty();
    return true;
  }

  // ------------------------------------------------------------ request counter
  _utcDay() {
    return new Date().toISOString().slice(0, 10);
  }

  async bumpRequestCounter() {
    await tick();
    const day = this._utcDay();
    this._data.reqcount[day] = (this._data.reqcount[day] || 0) + 1;
    // پاک‌سازی روزهای قدیمی‌تر از ۳ روز
    const cutoff = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
    for (const d of Object.keys(this._data.reqcount)) {
      if (d < cutoff) delete this._data.reqcount[d];
    }
    this._markDirty();
    return this._data.reqcount[day];
  }

  async getRequestCounter() {
    await tick();
    return this._data.reqcount[this._utcDay()] || 0;
  }

  async getRequestCounterHistory(days = 7) {
    await tick();
    const now = new Date();
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
      out.push({ day: d, count: this._data.reqcount[d] || 0 });
    }
    return out;
  }

  // ------------------------------------------------------------------ misc
  async newId() {
    return newId();
  }

  async healthBackend() {
    return "in-memory (file-persisted)";
  }

  // --------------------------------------------------------- backup/restore
  async exportAll() {
    await tick();
    return {
      version: 1,
      app: "chop",
      exported_at: Date.now() / 1000,
      configs: { ...this._data.configs },
      usage: { ...this._data.usage },
      traffic_hourly: { ...this._data.traffic },
      bot_settings: await this.getBotSettings(),
      bot_admins: { ...this._data.bot_admins },
      bot_members: { ...this._data.bot_members },
      logs_all: this._data.logall.slice(),
    };
  }

  async importAll(data, mode = "replace") {
    await tick();
    if (!data || typeof data !== "object" || !("configs" in data)) {
      throw new Error("فایل بکاپ معتبر نیست");
    }

    if (mode === "replace") {
      this._data.configs = {};
      this._data.usage = {};
      this._data.uuidx = {};
      this._data.traffic = {};
      this._data.bot_admins = {};
      this._data.bot_members = {};
      this._data.bot_pending = {};
      this._data.logall = [];
      this._data.online = {};
      this._cfgCache.clear();
    }

    const counters = { configs: 0, admins: 0, members: 0 };

    for (const [configId, cfg] of Object.entries(data.configs || {})) {
      this._data.configs[configId] = { ...cfg };
      if (cfg && cfg.uuid) this._data.uuidx[cfg.uuid] = configId;
      counters.configs++;
    }
    for (const [configId, used] of Object.entries(data.usage || {})) {
      this._data.usage[configId] = Number(used) || 0;
    }
    for (const [bucket, val] of Object.entries(data.traffic_hourly || {})) {
      this._data.traffic[bucket] = Number(val) || 0;
    }

    const botSettings = data.bot_settings || {};
    if (botSettings.token || botSettings.enabled !== undefined) {
      await this.saveBotSettings(botSettings.token || "", !!botSettings.enabled, botSettings.secret || "");
    }

    for (const [tgId, admin] of Object.entries(data.bot_admins || {})) {
      this._data.bot_admins[tgId] = { ...admin };
      counters.admins++;
    }
    for (const [tgId, member] of Object.entries(data.bot_members || {})) {
      this._data.bot_members[tgId] = { ...member };
      counters.members++;
    }

    const allLogEntries = [...(data.logs_all || [])];
    for (const entries of Object.values(data.logs_per_config || {})) {
      if (Array.isArray(entries)) allLogEntries.push(...entries);
    }
    if (allLogEntries.length) {
      this._data.logall = allLogEntries.slice(0, LOG_MAX_ALL);
    }

    this._markDirty();
    return counters;
  }
}

/** singleton سراسری، درست مثل getStore(env) نسخه‌ی قبلی */
let _store = null;
export function getStore() {
  if (!_store) _store = new ChopStore();
  return _store;
}
