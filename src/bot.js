/**
 * bot.js — ربات تلگرام Chop (پورت مستقیم bot.py)
 *
 * روی Vercel/Workers هردو، polling امکان‌پذیر نیست (پروسه‌ی درازمدت وجود
 * نداره)، پس از webhook استفاده می‌شه: تلگرام هر پیام/کلیک رو با یک POST
 * به آدرس webhook می‌فرسته و همون‌جا سریع پردازش و پاسخ داده می‌شه.
 */
import { buildLinks, subscriptionUrl, DEFAULT_CLEAN_IPS } from "./linkbuilder.js";

const TELEGRAM_API = (token, method) => `https://api.telegram.org/bot${token}/${method}`;

export async function makeSecret(token) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

async function tgCall(token, method, payload) {
  try {
    const res = await fetch(TELEGRAM_API(token, method), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch {
    return { ok: false, description: "network error" };
  }
}

export async function sendMessage(token, chatId, text, replyMarkup = null) {
  const payload = { chat_id: chatId, text, parse_mode: "HTML" };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  return tgCall(token, "sendMessage", payload);
}

// برای ارسال به چندتا کاربر همزمان: تلگرام سقفِ سراسریِ حدود ۳۰ پیام در
// ثانیه داره؛ با فاصله‌ی ~۴۰ میلی‌ثانیه بین پیام‌ها (~۲۵ در ثانیه) زیر اون
// سقف می‌مونیم و ۴۲۹ (Too Many Requests) نمی‌گیریم. لیستِ کسانی که ربات رو
// بلاک کرده‌ن یا چتشون پاک شده هم برمی‌گردونیم تا از لیستِ اعضا حذف بشن.
export async function sendBroadcast(token, chatIds, text) {
  let sent = 0;
  let failed = 0;
  const blocked = [];
  for (const chatId of chatIds) {
    const result = await sendMessage(token, chatId, text);
    if (result.ok) {
      sent++;
    } else {
      failed++;
      const desc = (result.description || "").toLowerCase();
      if (desc.includes("blocked") || desc.includes("chat not found") || desc.includes("deactivated") || desc.includes("kicked")) {
        blocked.push(String(chatId));
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  return { sent, failed, blocked };
}

export async function sendDocument(token, chatId, filename, content, caption = "") {
  try {
    const form = new FormData();
    form.append("chat_id", String(chatId));
    form.append("caption", caption);
    form.append("document", new Blob([content], { type: "application/json" }), filename);
    const res = await fetch(TELEGRAM_API(token, "sendDocument"), { method: "POST", body: form });
    return await res.json();
  } catch {
    return { ok: false, description: "network error" };
  }
}

export async function setWebhook(token, url, secret) {
  return tgCall(token, "setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
  });
}

export async function deleteWebhook(token) {
  return tgCall(token, "deleteWebhook", {});
}

function fmtBytes(n) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = Number(n || 0);
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return i ? `${v.toFixed(1)} ${units[i]}` : `${Math.trunc(v)} ${units[i]}`;
}

// ── ابزارهای نمایشی مشترک پیام‌ها ─────────────────────────────────────

// فرار دادن کاراکترهای HTML — اسم کانفیگ/کاربر با parse_mode:HTML ارسال
// می‌شه؛ بدون این، اسمی مثل «<ویدی>» کل پیام رو خراب می‌کنه (تلگرام 400
// می‌ده) و اسم جعلی می‌تونه تگ تزریق کنه.
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// نوار پیشرفت یونیکد (۱۰ خانه) — حس داشبورد به پیام‌ها می‌ده
function progressBars(ratio, width = 10) {
  const r = Math.max(0, Math.min(1, ratio));
  const filled = Math.round(r * width);
  return { filled, bar: "█".repeat(filled) + "░".repeat(Math.max(0, width - filled)) };
}

function trafficBarText(config) {
  const used = config.used_bytes || 0;
  const total = config.traffic_limit_bytes || 0;
  const label = `${fmtBytes(used)}${total ? " از " + fmtBytes(total) : ""}`;
  if (!total) return `${label} ∞`;
  const { bar } = progressBars(used / total);
  const pct = ((used / total) * 100).toFixed(1);
  return `${bar} ${pct}٪\n📦 ${label}`;
}

function expiryLabel(config) {
  const exp = config.expires_at;
  if (!exp) return "بدون انقضا ∞";
  const remaining = exp - Date.now() / 1000;
  if (remaining <= 0) return "منقضی‌شده ⛔";
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  if (days > 0) return `${days} روز و ${hours} ساعت مانده ⏳`;
  return `${hours} ساعت مانده ⏳`;
}

async function createConfig(store, name, trafficGb, expiresDays) {
  const config = {
    id: await store.newId(),
    name,
    uuid: crypto.randomUUID(),
    enabled: true,
    created_at: Date.now() / 1000,
    expires_at: expiresDays ? Date.now() / 1000 + expiresDays * 86400 : null,
    traffic_limit_bytes: Math.trunc(trafficGb * 1024 * 1024 * 1024),
    ip_limit: 0,
    fingerprint: "chrome",
    alpn: "http/1.1",
    port: 443,
    transport: "ws",
    proxies: [],
    clean_ips: [...DEFAULT_CLEAN_IPS],
    location: "",
  };
  await store.saveConfig(config);
  return config;
}

const trafficKeyboard = () => ({
  inline_keyboard: [
    [{ text: "نامحدود", callback_data: "cfgtraffic:0" }],
    [
      { text: "10 GB", callback_data: "cfgtraffic:10" },
      { text: "50 GB", callback_data: "cfgtraffic:50" },
    ],
    [
      { text: "100 GB", callback_data: "cfgtraffic:100" },
      { text: "200 GB", callback_data: "cfgtraffic:200" },
    ],
    [{ text: "❌ انصراف", callback_data: "cfgcancel" }],
  ],
});

const daysKeyboard = () => ({
  inline_keyboard: [
    [{ text: "بدون انقضا", callback_data: "cfgdays:0" }],
    [
      { text: "۷ روز", callback_data: "cfgdays:7" },
      { text: "۳۰ روز", callback_data: "cfgdays:30" },
    ],
    [
      { text: "۹۰ روز", callback_data: "cfgdays:90" },
      { text: "۳۶۵ روز", callback_data: "cfgdays:365" },
    ],
    [{ text: "❌ انصراف", callback_data: "cfgcancel" }],
  ],
});

const FINGERPRINTS = ["chrome", "firefox", "safari", "ios", "edge", "random"];

function fpKeyboard(configId) {
  const rows = [];
  let row = [];
  for (const fp of FINGERPRINTS) {
    row.push({ text: fp, callback_data: `cfgsetfp:${configId}:${fp}` });
    if (row.length === 3) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length) rows.push(row);
  rows.push([{ text: "🔙 بازگشت", callback_data: `cfgedit:${configId}` }]);
  return { inline_keyboard: rows };
}

const editTrafficKeyboard = (configId) => ({
  inline_keyboard: [
    [{ text: "نامحدود", callback_data: `cfgsettraffic:${configId}:0` }],
    [
      { text: "10 GB", callback_data: `cfgsettraffic:${configId}:10` },
      { text: "50 GB", callback_data: `cfgsettraffic:${configId}:50` },
    ],
    [
      { text: "100 GB", callback_data: `cfgsettraffic:${configId}:100` },
      { text: "200 GB", callback_data: `cfgsettraffic:${configId}:200` },
    ],
    [{ text: "🔙 بازگشت", callback_data: `cfgedit:${configId}` }],
  ],
});

const editDaysKeyboard = (configId) => ({
  inline_keyboard: [
    [{ text: "بدون انقضا", callback_data: `cfgsetdays:${configId}:0` }],
    [
      { text: "۷ روز", callback_data: `cfgsetdays:${configId}:7` },
      { text: "۳۰ روز", callback_data: `cfgsetdays:${configId}:30` },
    ],
    [
      { text: "۹۰ روز", callback_data: `cfgsetdays:${configId}:90` },
      { text: "۳۶۵ روز", callback_data: `cfgsetdays:${configId}:365` },
    ],
    [{ text: "🔙 بازگشت", callback_data: `cfgedit:${configId}` }],
  ],
});

function menu(admin) {
  const rows = [
    [{ text: "📊 وضعیت سرویس", callback_data: "status" }],
    [
      { text: "📖 راهنما", callback_data: "help" },
      { text: "ℹ️ آی‌دی من", callback_data: "myid" },
    ],
  ];
  if (admin) {
    rows.unshift([{ text: "➕ ساخت کانفیگ جدید", callback_data: "newconfig" }]);
    rows.splice(2, 0, [{ text: "📋 مدیریت کانفیگ‌ها", callback_data: "cfglist:0" }]);
    rows.splice(3, 0, [{ text: "👥 اعضا", callback_data: "members:0" }, { text: "🛡 ادمین‌ها", callback_data: "admins" }]);
    rows.push([{ text: "🗄 بکاپ کامل (JSON)", callback_data: "backup" }]);
  }
  return { inline_keyboard: rows };
}

const helpText = (admin) =>
  "📖 <b>راهنمای ربات Chop</b>\n" +
  "━━━━━━━━━━━━━━━\n" +
  "<b>دستورها:</b>\n" +
  "/start — منوی اصلی\n" +
  "/id — نمایش آی‌دی عددی شما\n" +
  (admin
    ? "/admin — پنل مدیریت\n/backup — دریافت بکاپ کامل\n/addadmin &lt;آی‌دی&gt; — افزودن ادمین\n/deladmin &lt;آی‌دی&gt; — حذف ادمین\n/cancel — لغو عملیات جاری\n\n" +
      "<b>نکته‌ها:</b>\n" +
      "• برای ساخت کانفیگ، دکمه‌ی «ساخت کانفیگ جدید» رو بزن و مراحل رو دنبال کن.\n" +
      "• تو هر کانفیگ می‌تونی ترافیک، انقضا، پورت، Fingerprint و ALPN رو عوض کنی.\n" +
      "• «لینک اتصال» رو مستقیم توی کلاینت باز کن یا سابسکریپشن رو اضافه کن."
    : "• برای دریافت کانفیگ با ادمین چت کن.\n• با دکمه‌ی «وضعیت سرویس» می‌تونی آمار عمومی رو ببینی.");

async function statusText(store) {
  const configs = await store.listConfigs();
  const nowSec = Date.now() / 1000;
  let totalOnline = 0;
  for (const c of configs) totalOnline += await store.onlineIpCount(c.id);
  const totalUsed = configs.reduce((sum, c) => sum + (c.used_bytes || 0), 0);
  const totalLimit = configs.reduce((s, c) => s + (c.traffic_limit_bytes || 0), 0);
  const active = configs.filter((c) => c.enabled !== false && (!c.expires_at || c.expires_at > nowSec)).length;
  const expired = configs.filter((c) => c.expires_at && c.expires_at <= nowSec).length;
  const { bar } = progressBars(totalLimit ? totalUsed / totalLimit : 0);
  return (
    "📊 <b>وضعیت سرویس</b>\n" +
    "━━━━━━━━━━━━━━━\n" +
    `⚙️ کانفیگ‌ها: <b>${configs.length}</b> (${active} فعال${expired ? `، ${expired} منقضی` : ""})\n` +
    `🟢 آنلاین الان: <b>${totalOnline}</b>\n` +
    `📦 ترافیک کل: <b>${fmtBytes(totalUsed)}</b>${totalLimit ? ` از ${fmtBytes(totalLimit)}` : " (نامحدود)"}\n` +
    (totalLimit ? `${bar} ${((totalUsed / totalLimit) * 100).toFixed(1)}٪\n` : "") +
    "━━━━━━━━━━━━━━━"
  );
}

async function membersPage(store, page = 0, perPage = 10) {
  const members = await store.listBotMembers();
  const start = page * perPage;
  const chunk = members.slice(start, start + perPage);
  if (!members.length) {
    return ["هیچ عضوی هنوز ثبت نشده.", { inline_keyboard: [[{ text: "🔙 بازگشت", callback_data: "back" }]] }];
  }
  const lines = [`👥 <b>اعضای ربات</b> — ${members.length} نفر\n`];
  for (const m of chunk) {
    const uname = m.username ? `@${esc(m.username)}` : "—";
    lines.push(`• ${esc(m.first_name || "—")} (${uname}) — <code>${esc(m.id)}</code>`);
  }
  const nav = [];
  if (start > 0) nav.push({ text: "◀️ قبلی", callback_data: `members:${page - 1}` });
  if (start + perPage < members.length) nav.push({ text: "بعدی ▶️", callback_data: `members:${page + 1}` });
  const keyboard = [...(nav.length ? [nav] : []), [{ text: "🔙 بازگشت", callback_data: "back" }]];
  return [lines.join("\n"), { inline_keyboard: keyboard }];
}

async function adminsText(store) {
  const admins = await store.listBotAdmins();
  if (!admins.length) {
    return "هیچ ادمینی ثبت نشده.\n\nبرای افزودن، از پنل وب (تب «ربات تلگرام») یا با دستور /addadmin استفاده کن.";
  }
  return ["🛡 <b>ادمین‌های ربات</b>\n", ...admins.map((a) => `• <code>${a.id}</code>`)].join("\n");
}

function configDetailText(config) {
  const status = config.enabled !== false ? "فعال ✅" : "غیرفعال ⛔️";
  return (
    `⚙️ <b>${esc(config.name)}</b>\n` +
    `━━━━━━━━━━━━━━━\n` +
    `وضعیت: ${status}\n` +
    `📦 مصرف:\n${trafficBarText(config)}\n` +
    `👥 آی‌پی هم‌زمان: ${config.ip_limit || "نامحدود"}\n` +
    `🔌 پورت: ${config.port || 443}\n` +
    `🕵️ Fingerprint: ${esc(config.fingerprint || "chrome")}\n` +
    `📡 ALPN: ${esc(config.alpn || "http/1.1")}\n` +
    `⏳ انقضا: ${expiryLabel(config)}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `🆔 UUID: <code>${esc(config.uuid)}</code>`
  );
}

async function configsListPage(store, page = 0, perPage = 8) {
  const configs = await store.listConfigs();
  const start = page * perPage;
  const chunk = configs.slice(start, start + perPage);
  if (!configs.length) {
    return [
      "📋 <b>مدیریت کانفیگ‌ها</b>\n\nهنوز کانفیگی نساختی.",
      {
        inline_keyboard: [
          [{ text: "➕ ساخت کانفیگ جدید", callback_data: "newconfig" }],
          [{ text: "🔙 بازگشت", callback_data: "back" }],
        ],
      },
    ];
  }
  const rows = chunk.map((c) => {
    const dot = c.enabled !== false ? "🟢" : "⚪️";
    const usage = c.traffic_limit_bytes
      ? ` · ${Math.min(100, Math.round(((c.used_bytes || 0) / c.traffic_limit_bytes) * 100))}٪`
      : "";
    return [{ text: `${dot} ${c.name}${usage}`, callback_data: `cfgview:${c.id}` }];
  });
  const nav = [];
  if (start > 0) nav.push({ text: "◀️ قبلی", callback_data: `cfglist:${page - 1}` });
  if (start + perPage < configs.length) nav.push({ text: "بعدی ▶️", callback_data: `cfglist:${page + 1}` });
  if (nav.length) rows.push(nav);
  rows.push([{ text: "➕ ساخت کانفیگ جدید", callback_data: "newconfig" }]);
  rows.push([{ text: "🔙 بازگشت", callback_data: "back" }]);
  const text = `📋 <b>مدیریت کانفیگ‌ها</b> — ${configs.length} کانفیگ\n\nیکی رو برای مدیریت انتخاب کن:`;
  return [text, { inline_keyboard: rows }];
}

const configViewKeyboard = (config) => {
  const cid = config.id;
  const toggleLabel = config.enabled !== false ? "⛔️ غیرفعال کن" : "✅ فعال کن";
  return {
    inline_keyboard: [
      [{ text: "🔗 لینک اتصال", callback_data: `cfglink:${cid}` }],
      [
        { text: "✏️ ویرایش", callback_data: `cfgedit:${cid}` },
        { text: toggleLabel, callback_data: `cfgtoggle:${cid}` },
      ],
      [
        { text: "🔄 ریست مصرف", callback_data: `cfgreset:${cid}` },
        { text: "🗑 حذف", callback_data: `cfgdelask:${cid}` },
      ],
      [{ text: "🔙 بازگشت به لیست", callback_data: "cfglist:0" }],
    ],
  };
};

const configEditKeyboard = (config) => {
  const cid = config.id;
  return {
    inline_keyboard: [
      [{ text: "نام", callback_data: `cfgeditfield:${cid}:name` }],
      [{ text: "محدودیت ترافیک", callback_data: `cfgeditfield:${cid}:traffic` }],
      [{ text: "محدودیت آی‌پی", callback_data: `cfgeditfield:${cid}:iplimit` }],
      [{ text: "انقضا", callback_data: `cfgeditfield:${cid}:expiry` }],
      [{ text: "پورت", callback_data: `cfgeditfield:${cid}:port` }],
      [{ text: "Fingerprint", callback_data: `cfgeditfield:${cid}:fp` }],
      [{ text: "ALPN", callback_data: `cfgeditfield:${cid}:alpn` }],
      [{ text: "🔙 بازگشت", callback_data: `cfgview:${cid}` }],
    ],
  };
};

export async function handleUpdate(store, token, update, host) {
  if (update.message) {
    await handleMessage(store, token, update.message, host);
  } else if (update.callback_query) {
    await handleCallback(store, token, update.callback_query, host);
  }
}

async function handleMessage(store, token, message, host) {
  const chatId = message.chat.id;
  const fromUser = message.from || {};
  const tgId = String(fromUser.id);
  await store.upsertBotMember(tgId, fromUser.username || "", fromUser.first_name || "");
  const text = (message.text || "").trim();
  const admin = await store.isBotAdmin(tgId);

  if (text.startsWith("/cancel")) {
    await store.clearBotPending(tgId);
    await sendMessage(token, chatId, "لغو شد.", menu(admin));
    return;
  }

  const pending = admin ? await store.getBotPending(tgId) : null;

  if (pending && pending.step === "editvalue") {
    const { config_id: configId, field } = pending;
    const config = await store.getConfig(configId);
    if (!config) {
      await store.clearBotPending(tgId);
      await sendMessage(token, chatId, "این کانفیگ دیگه وجود نداره.", menu(admin));
      return;
    }
    const value = text.trim();
    if (!value || value.startsWith("/")) {
      await sendMessage(token, chatId, "یک مقدار معتبر بفرست (یا /cancel برای لغو).");
      return;
    }
    try {
      if (field === "name") {
        config.name = value;
      } else if (field === "iplimit") {
        const n = parseInt(value, 10);
        if (Number.isNaN(n)) throw new Error("invalid");
        config.ip_limit = Math.max(0, n);
      } else if (field === "port") {
        const p = parseInt(value, 10);
        if (Number.isNaN(p) || p < 1 || p > 65535) throw new Error("invalid");
        config.port = p;
      } else if (field === "alpn") {
        config.alpn = value;
      } else {
        throw new Error("invalid field");
      }
    } catch {
      await sendMessage(token, chatId, "مقدار نامعتبره. دوباره امتحان کن (یا /cancel).");
      return;
    }
    await store.saveConfig(config);
    await store.clearBotPending(tgId);
    const updated = await store.getConfig(configId);
    await sendMessage(
      token,
      chatId,
      "✅ به‌روزرسانی شد.\n\n" + configDetailText(updated),
      configViewKeyboard(updated)
    );
    return;
  }

  if (pending && pending.step === "name") {
    const name = text.trim();
    if (!name || name.startsWith("/")) {
      await sendMessage(token, chatId, "یک نام معتبر برای کانفیگ بفرست (یا /cancel برای لغو).");
      return;
    }
    pending.data.name = name;
    pending.step = "traffic";
    await store.setBotPending(tgId, pending);
    await sendMessage(token, chatId, `نام: <b>${esc(name)}</b>\n\nمحدودیت ترافیک رو انتخاب کن:`, trafficKeyboard());
    return;
  }

  if (pending) {
    await sendMessage(token, chatId, "لطفاً از دکمه‌های پیام قبلی انتخاب کن، یا /cancel بزن.");
    return;
  }

  if (text.startsWith("/start")) {
    const firstName = esc(fromUser.first_name || "");
    await sendMessage(
      token,
      chatId,
      `👋 سلام ${firstName} عزیز!\n\n` +
        `به ربات مدیریت <b>Chop</b> خوش اومدی.\n` +
        `از دکمه‌های زیر استفاده کن؛ اگه ادمین باشی، مدیریت کامل کانفیگ‌ها هم همین‌جاست.` +
        (admin ? "\n\n🛡 حالت ادمین فعاله." : ""),
      menu(admin)
    );
    return;
  }
  if (text.startsWith("/help")) {
    await sendMessage(token, chatId, helpText(admin), menu(admin));
    return;
  }
  if (text.startsWith("/id")) {
    await sendMessage(token, chatId, `آی‌دی عددی شما: <code>${tgId}</code>`);
    return;
  }
  if (text.startsWith("/admin")) {
    if (!admin) {
      await sendMessage(token, chatId, "⛔️ این بخش فقط برای ادمین‌هاست.");
      return;
    }
    await sendMessage(token, chatId, "🛡 پنل مدیریت", menu(admin));
    return;
  }
  if (text.startsWith("/backup")) {
    if (!admin) {
      await sendMessage(token, chatId, "⛔️ این بخش فقط برای ادمین‌هاست.");
      return;
    }
    const dump = await store.exportAll();
    const payload = JSON.stringify(dump, null, 2);
    const filename = `chop-backup-${Math.floor(Date.now() / 1000)}.json`;
    const result = await sendDocument(token, chatId, filename, payload, "🗄 بکاپ کامل تنظیمات Chop");
    if (!result.ok) await sendMessage(token, chatId, "⚠️ ارسال فایل بکاپ ناموفق بود.");
    return;
  }
  if (text.startsWith("/addadmin")) {
    if (!admin) {
      await sendMessage(token, chatId, "⛔️ فقط ادمین‌های فعلی می‌تونن ادمین جدید اضافه کنن.");
      return;
    }
    const parts = text.split(/\s+/);
    if (parts.length !== 2 || !/^\d+$/.test(parts[1])) {
      await sendMessage(
        token,
        chatId,
        "استفاده: <code>/addadmin 123456789</code>\nآی‌دی عددی شخص رو با دستور /id از خودش بگیر."
      );
      return;
    }
    await store.addBotAdmin(parts[1], tgId);
    await sendMessage(token, chatId, `✅ کاربر <code>${parts[1]}</code> ادمین شد.`);
    return;
  }
  if (text.startsWith("/deladmin")) {
    if (!admin) {
      await sendMessage(token, chatId, "⛔️ فقط ادمین‌ها می‌تونن ادمین حذف کنن.");
      return;
    }
    const parts = text.split(/\s+/);
    if (parts.length !== 2) {
      await sendMessage(token, chatId, "استفاده: <code>/deladmin 123456789</code>");
      return;
    }
    await store.removeBotAdmin(parts[1]);
    await sendMessage(token, chatId, `✅ دسترسی ادمین <code>${parts[1]}</code> حذف شد.`);
    return;
  }

  await sendMessage(token, chatId, "دستور نامعتبره. از /start شروع کن یا از دکمه‌های زیر استفاده کن.", menu(admin));
}

async function handleCallback(store, token, callback, host) {
  // دکمه‌ی یک پیام خیلی قدیمی/پاک‌شده: بدون این چک، callback.message undefined
  // می‌مونه و پردازش بعدی با خطا webhook رو خراب می‌کنه.
  if (!callback.message || !callback.message.chat) {
    await tgCall(token, "answerCallbackQuery", {
      callback_query_id: callback.id,
      text: "این پیام خیلی قدیمیه — از /start شروع کن.",
      show_alert: false,
    }).catch(() => {});
    return;
  }
  const chatId = callback.message.chat.id;
  const messageId = callback.message.message_id;
  const fromUser = callback.from || {};
  const tgId = String(fromUser.id);
  await store.upsertBotMember(tgId, fromUser.username || "", fromUser.first_name || "");
  const data = callback.data || "";
  const admin = await store.isBotAdmin(tgId);

  await tgCall(token, "answerCallbackQuery", { callback_query_id: callback.id });

  // اگه پیام اصلی (مثلاً پس از گذر زمان) برای ویرایش دیگه موجود نباشه،
  // به‌جای خطا، پیام جدید می‌فرستیم تا دکمه‌ها همچنان کار کنن.
  const edit = async (text, replyMarkup) => {
    const result = await tgCall(token, "editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    });
    const desc = (result && result.description ? String(result.description) : "").toLowerCase();
    if (!result || result.ok !== true) {
      if (desc.includes("message is not modified")) return; // کلیک تکراری روی همون دکمه — نرماله
      if (desc.includes("message to edit not found") || desc.includes("message can't be edited") || desc.includes("message to delete not found")) {
        await sendMessage(token, chatId, text, replyMarkup);
      }
    }
  };

  const hostOrDefault = host || "your-worker.workers.dev";

  if (data === "status") {
    await edit(await statusText(store), menu(admin));
  } else if (data === "help") {
    await edit(helpText(admin), menu(admin));
  } else if (data === "myid") {
    await edit(`آی‌دی عددی شما: <code>${tgId}</code>`, menu(admin));
  } else if (data.startsWith("members:") && admin) {
    const page = parseInt(data.split(":")[1], 10);
    const [text, markup] = await membersPage(store, page);
    await edit(text, markup);
  } else if (data === "admins" && admin) {
    await edit(await adminsText(store), { inline_keyboard: [[{ text: "🔙 بازگشت", callback_data: "back" }]] });
  } else if (data === "newconfig" && admin) {
    await store.setBotPending(tgId, { step: "name", data: {} });
    await edit("✏️ نام کانفیگ جدید رو در یک پیام بفرست:", {
      inline_keyboard: [[{ text: "❌ انصراف", callback_data: "cfgcancel" }]],
    });
  } else if (data.startsWith("cfgtraffic:") && admin) {
    const pending = await store.getBotPending(tgId);
    if (!pending || pending.step !== "traffic") {
      await edit("این مرحله منقضی شده. دوباره از منو شروع کن.", menu(admin));
    } else {
      pending.data.traffic_gb = parseFloat(data.split(":")[1]);
      pending.step = "days";
      await store.setBotPending(tgId, pending);
      await edit("⏳ مدت انقضا رو انتخاب کن:", daysKeyboard());
    }
  } else if (data.startsWith("cfgdays:") && admin) {
    const pending = await store.getBotPending(tgId);
    if (!pending || pending.step !== "days") {
      await edit("این مرحله منقضی شده. دوباره از منو شروع کن.", menu(admin));
    } else {
      const days = parseInt(data.split(":")[1], 10);
      const cfgData = pending.data;
      await store.clearBotPending(tgId);
      const config = await createConfig(store, cfgData.name, cfgData.traffic_gb || 0, days);
      const link = buildLinks(config, hostOrDefault)[0];
      const trafficLabel = config.traffic_limit_bytes ? fmtBytes(config.traffic_limit_bytes) : "نامحدود";
      const expiryLabelText = days ? `${days} روز` : "بدون انقضا";
      await edit(
        `✅ کانفیگ <b>${esc(config.name)}</b> ساخته شد.\n` +
          `ترافیک: ${trafficLabel} · انقضا: ${expiryLabelText}\n\n<code>${link}</code>`,
        menu(admin)
      );
    }
  } else if (data === "cfgcancel") {
    await store.clearBotPending(tgId);
    await edit("لغو شد.", menu(admin));
  } else if (data.startsWith("cfglist:") && admin) {
    const page = parseInt(data.split(":")[1], 10);
    const [text, markup] = await configsListPage(store, page);
    await edit(text, markup);
  } else if (data.startsWith("cfgview:") && admin) {
    const config = await store.getConfig(data.slice("cfgview:".length));
    if (!config) await edit("این کانفیگ دیگه وجود نداره.", menu(admin));
    else await edit(configDetailText(config), configViewKeyboard(config));
  } else if (data.startsWith("cfgedit:") && admin) {
    const config = await store.getConfig(data.slice("cfgedit:".length));
    if (!config) {
      await edit("این کانفیگ دیگه وجود نداره.", menu(admin));
    } else {
      await store.clearBotPending(tgId);
      await edit(`✏️ ویرایش <b>${esc(config.name)}</b>\n\nکدوم فیلد رو می‌خوای تغییر بدی؟`, configEditKeyboard(config));
    }
  } else if (data.startsWith("cfgeditfield:") && admin) {
    const [, configId, field] = data.split(":");
    const config = await store.getConfig(configId);
    if (!config) {
      await edit("این کانفیگ دیگه وجود نداره.", menu(admin));
    } else if (field === "traffic") {
      await edit("محدودیت ترافیک جدید رو انتخاب کن:", editTrafficKeyboard(configId));
    } else if (field === "expiry") {
      await edit("مدت انقضای جدید رو انتخاب کن:", editDaysKeyboard(configId));
    } else if (field === "fp") {
      await edit("Fingerprint جدید رو انتخاب کن:", fpKeyboard(configId));
    } else if (["name", "iplimit", "port", "alpn"].includes(field)) {
      await store.setBotPending(tgId, { step: "editvalue", config_id: configId, field });
      const prompts = {
        name: "✏️ نام جدید رو بفرست:",
        iplimit: "🔢 محدودیت آی‌پی هم‌زمان جدید رو بفرست (۰ = نامحدود):",
        port: "🔢 پورت جدید رو بفرست (۱ تا ۶۵۵۳۵):",
        alpn: "✏️ مقدار ALPN جدید رو بفرست (مثلاً http/1.1):",
      };
      await edit(prompts[field], { inline_keyboard: [[{ text: "❌ انصراف", callback_data: `cfgedit:${configId}` }]] });
    } else {
      await edit("فیلد نامعتبر.", configEditKeyboard(config));
    }
  } else if (data.startsWith("cfgsettraffic:") && admin) {
    const [, configId, gb] = data.split(":");
    const config = await store.getConfig(configId);
    if (config) {
      config.traffic_limit_bytes = Math.trunc(parseFloat(gb) * 1024 * 1024 * 1024);
      await store.saveConfig(config);
      const updated = await store.getConfig(configId);
      await edit("✅ محدودیت ترافیک به‌روزرسانی شد.\n\n" + configDetailText(updated), configViewKeyboard(updated));
    } else {
      await edit("این کانفیگ دیگه وجود نداره.", menu(admin));
    }
  } else if (data.startsWith("cfgsetdays:") && admin) {
    const [, configId, daysStr] = data.split(":");
    const config = await store.getConfig(configId);
    if (config) {
      const days = parseInt(daysStr, 10);
      config.expires_at = days ? Date.now() / 1000 + days * 86400 : null;
      await store.saveConfig(config);
      const updated = await store.getConfig(configId);
      await edit("✅ انقضا به‌روزرسانی شد.\n\n" + configDetailText(updated), configViewKeyboard(updated));
    } else {
      await edit("این کانفیگ دیگه وجود نداره.", menu(admin));
    }
  } else if (data.startsWith("cfgsetfp:") && admin) {
    const [, configId, fp] = data.split(":");
    const config = await store.getConfig(configId);
    if (config) {
      config.fingerprint = fp;
      await store.saveConfig(config);
      const updated = await store.getConfig(configId);
      await edit("✅ Fingerprint به‌روزرسانی شد.\n\n" + configDetailText(updated), configViewKeyboard(updated));
    } else {
      await edit("این کانفیگ دیگه وجود نداره.", menu(admin));
    }
  } else if (data.startsWith("cfgtoggle:") && admin) {
    const config = await store.getConfig(data.slice("cfgtoggle:".length));
    if (config) {
      config.enabled = !(config.enabled !== false);
      await store.saveConfig(config);
      const updated = await store.getConfig(config.id);
      await edit(configDetailText(updated), configViewKeyboard(updated));
    } else {
      await edit("این کانفیگ دیگه وجود نداره.", menu(admin));
    }
  } else if (data.startsWith("cfgreset:") && admin) {
    const configId = data.slice("cfgreset:".length);
    const config = await store.getConfig(configId);
    if (config) {
      await store.resetUsage(configId);
      const updated = await store.getConfig(configId);
      await edit("✅ مصرف ریست شد.\n\n" + configDetailText(updated), configViewKeyboard(updated));
    } else {
      await edit("این کانفیگ دیگه وجود نداره.", menu(admin));
    }
  } else if (data.startsWith("cfglink:") && admin) {
    const config = await store.getConfig(data.slice("cfglink:".length));
    if (!config) {
      await edit("این کانفیگ دیگه وجود نداره.", menu(admin));
    } else {
      const links = buildLinks(config, hostOrDefault);
      const sub = subscriptionUrl(config, hostOrDefault);
      const extra = links.length > 1 ? `\n\n(${links.length} لینک — به ازای هر آی‌پی تمیز یکی؛ لینک اول نشون داده شده)` : "";
      await edit(
        `🔗 لینک اتصال <b>${esc(config.name)}</b>:\n\n<code>${links[0]}</code>${extra}\n\n📡 سابسکریپشن:\n<code>${sub}</code>`,
        {
          inline_keyboard: [[{ text: "🔙 بازگشت", callback_data: `cfgview:${config.id}` }]],
        }
      );
    }
  } else if (data.startsWith("cfgdelask:") && admin) {
    const config = await store.getConfig(data.slice("cfgdelask:".length));
    if (!config) {
      await edit("این کانفیگ دیگه وجود نداره.", menu(admin));
    } else {
      await edit(`⚠️ مطمئنی می‌خوای <b>${esc(config.name)}</b> رو برای همیشه حذف کنی؟`, {
        inline_keyboard: [
          [{ text: "✅ بله، حذف کن", callback_data: `cfgdelyes:${config.id}` }],
          [{ text: "❌ انصراف", callback_data: `cfgview:${config.id}` }],
        ],
      });
    }
  } else if (data.startsWith("cfgdelyes:") && admin) {
    const configId = data.slice("cfgdelyes:".length);
    const config = await store.getConfig(configId);
    const name = config ? config.name : configId;
    await store.deleteConfig(configId);
    const [text, markup] = await configsListPage(store, 0);
    await edit(`🗑 کانفیگ «${esc(name)}» حذف شد.\n\n${text}`, markup);
  } else if (data === "backup" && admin) {
    await edit("⏳ در حال آماده‌سازی فایل بکاپ…", menu(admin));
    const dump = await store.exportAll();
    const payload = JSON.stringify(dump, null, 2);
    const filename = `chop-backup-${Math.floor(Date.now() / 1000)}.json`;
    const result = await sendDocument(token, chatId, filename, payload, "🗄 بکاپ کامل تنظیمات Chop");
    if (!result.ok) await sendMessage(token, chatId, "⚠️ ارسال فایل بکاپ ناموفق بود.", menu(admin));
  } else if (data === "back") {
    await edit(admin ? "🛡 پنل مدیریت" : "منوی اصلی", menu(admin));
  } else {
    await edit("⛔️ دسترسی لازم رو نداری.", menu(admin));
  }
}
