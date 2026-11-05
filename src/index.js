/**
 * index.js — Worker اصلی Chop (پورت main.py)
 */
import { createSessionCookie, verifySessionCookie, parseCookies } from "./authcookie.js";
import { getStore } from "./store.js";
import { buildLinks, subscriptionUrl } from "./linkbuilder.js";
import * as bot from "./bot.js";
import * as ui from "./ui.js";
import https from "node:https";
import fs from "node:fs";
import os from "node:os";
import { DEFAULT_CLEAN_IPS } from "./linkbuilder.js";
import { getActiveSessionCount } from "./wsrelay.js";


const WS_PATH = "/ws";
const DEFAULT_CLEAN_IP_LIST_URL = "https://hoplimit.shop/ips.txt";
// روی Vercel، برخلاف Cloudflare Workers، سقف ثابت «۱۰۰ هزار درخواست رایگان
// در روز» وجود نداره (قیمت‌گذاری Vercel بر اساس Active CPU/Function
// invocations است، نه یه عدد ثابت روزانه). این مقدار فقط یک عدد مرجعِ
// قابل‌تغییره که خودت از تنظیمات پنل هرچی می‌خوای می‌تونی روش بذاری (مثلاً
// برای مقایسه با سقف پلنِ خودت).
const DEFAULT_DAILY_REQUEST_LIMIT = 100000;

// رنج‌های رسمی IPv4 شبکه‌ی Cloudflare — از https://www.cloudflare.com/ips-v4/
// این‌ها ثابتن (به‌ندرت عوض می‌شن) و نیازی به هیچ سرویس شخص‌ثالث ندارن؛
// اسکنر «آی‌پی تمیز» با نمونه‌گیری تصادفی از همین رنج‌ها کار می‌کنه.
//
// ⚠️ این ویژگی («آی‌پی تمیز») فقط وقتی روی Vercel معنی داره که دامنه‌ی
// همین دیپلوی از طریق Cloudflare (ابر نارنجی) جلوی Vercel پراکسی شده
// باشه. اگه مستقیم از دامنه/ساب‌دامنه‌ی خودِ Vercel استفاده می‌کنی (بدون
// Cloudflare جلوش)، این IPها به دیپلوی تو ختم نمی‌شن و همه در تست رد
// می‌شن — که طبیعیه، نه یه باگ.
const CF_IPV4_RANGES = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
];

// ── رنج/آی‌پی‌های Vercel ──────────────────────────────────────────────
// ⚠️ برخلاف Cloudflare، خودِ Vercel یک رنج IPv4 رسمی برای این کار منتشر
// نمی‌کنه (توی مستنداتشون صراحتاً گفتن به‌خاطر Anycast نمی‌شه لیست IP
// برای allowlist داد). این‌جا فقط همون چند آدرس anycast عمومی‌ای هستن که
// خودِ پنل دامنه‌ی Vercel به پروژه‌ها نشون می‌ده (۷۶.۷۶.۲۱.۲۱ و
// ۲۱۶.۱۹۸.۷۹.۱). یه سری بلوک /24 دیگه هم از منابع شخص‌ثالث (netify،
// networksdb) به Vercel نسبت داده می‌شن، ولی چون معلوم نیست واقعاً بخشی از
// همون لبه‌ی مسیریابِ چندمستأجریِ Vercel باشن یا زیرساخت دیگه‌ای، عمداً
// حذف شدن — نتیجه‌ی عملی‌شون توی تست، رد شدنِ تقریباً همه‌ی موارد بود.
// یعنی این لیست خیلی کوچیک‌تر از Cloudflare می‌مونه؛ اگه IP دیگه‌ای رو
// خودت مطمئنی که کار می‌کنه، با «تست تکی» بالای همین باکس اضافه‌ش کن.
const VERCEL_IPV4_CANDIDATES = ["76.76.21.21", "216.198.79.1"];

function ipToInt(ip) {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}
function intToIp(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}
function randomIpFromCidr(cidr) {
  const [base, prefixStr] = cidr.split("/");
  const prefix = parseInt(prefixStr, 10);
  const hostBits = 32 - prefix;
  const baseInt = ipToInt(base);
  const maxHostVal = hostBits >= 31 ? 0 : (2 ** hostBits) >>> 0;
  // از انتخاب .0 (شبکه) و آخرین آدرس (broadcast) صرف‌نظر می‌کنیم
  const hostVal = hostBits <= 1 ? 0 : 1 + Math.floor(Math.random() * (maxHostVal - 2));
  return intToIp((baseInt + hostVal) >>> 0);
}
function randomCleanIpCandidates(n, ranges) {
  const out = new Set();
  let guard = 0;
  while (out.size < n && guard < n * 20) {
    guard++;
    const cidr = ranges[Math.floor(Math.random() * ranges.length)];
    out.add(randomIpFromCidr(cidr));
  }
  return [...out];
}


async function testOneIp(host, ip, timeoutMs) {
  // معادل Node برای `cf: { resolveOverride: ip }` کلادفلر: با `lookup`
  // اتصال TCP رو مستقیم به همون IP هدایت می‌کنیم، ولی هدر Host و SNI
  // (`servername`) رو دامنه‌ی خودِ سرویس نگه می‌داریم.
  //
  // ⚠️ نکته‌ی مهم: این تکنیک («آی‌پی تمیز») اصلاً یک ترفند مخصوص شبکه‌ی
  // Cloudflare است (روتینگ بر اساس SNI در لبه‌ی Anycast اون‌ها). روی
  // زیرساخت Vercel این تست فقط زمانی معنی داره که دامنه‌ی این دیپلوی
  // *هم* از طریق Cloudflare (ابر نارنجی) جلوی Vercel پراکسی شده باشه؛
  // وگرنه این IPها اصلاً به Vercel ختم نمی‌شن و همه رد می‌شن.
  const started = Date.now();
  return new Promise((resolve) => {
    const req = https.request(
      {
        host,
        servername: host,
        path: "/api/health",
        method: "GET",
        timeout: timeoutMs,
        lookup: (_hostname, _opts, cb) => cb(null, ip, 4),
      },
      (res) => {
        res.resume();
        resolve({ ip, ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, ms: Date.now() - started });
      }
    );
    req.on("timeout", () => {
      req.destroy();
      resolve({ ip, ok: false, error: "timeout", ms: Date.now() - started });
    });
    req.on("error", (e) => {
      resolve({ ip, ok: false, error: e && e.message ? e.message : "خطا در اتصال", ms: Date.now() - started });
    });
    req.end();
  });
}
async function scanCleanIps({ host, want = 10, candidates = 60, concurrency = 8, timeoutMs = 2500, deadlineMs = 20000, provider = "cloudflare" }) {
  const pool =
    provider === "vercel"
      ? VERCEL_IPV4_CANDIDATES // لیست خیلی کوچیکه، همه رو مستقیم تست می‌کنیم
      : randomCleanIpCandidates(candidates, CF_IPV4_RANGES);
  const found = [];
  const failReasons = {}; // شمارش نوع خطا (timeout، ECONNREFUSED و...) برای دیباگ وقتی هیچی پیدا نشه
  const start = Date.now();
  let idx = 0;
  async function worker() {
    while (idx < pool.length) {
      if (Date.now() - start > deadlineMs) return;
      if (found.length >= want) return;
      const ip = pool[idx++];
      const result = await testOneIp(host, ip, timeoutMs);
      if (result.ok) {
        found.push(result);
      } else {
        const key = result.error || `status ${result.status}`;
        failReasons[key] = (failReasons[key] || 0) + 1;
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  found.sort((a, b) => a.ms - b.ms);
  return { found, tested: idx, candidates: pool.length, failReasons };
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json; charset=utf-8", ...(init.headers || {}) },
  });
}

function html(str, init = {}) {
  return new Response(str, {
    ...init,
    headers: { "Content-Type": "text/html; charset=utf-8", ...(init.headers || {}) },
  });
}

// چون webadapter.js بدنه‌ی پاسخ رو کامل بافر می‌کنه، ست‌کردن صریح
// Content-Length به مرورگر اجازه می‌ده progress بارگذاری صفحه رو درست نشون بده.
html.setLength = true;

function errorJson(status, detail) {
  return json({ detail }, { status });
}

function hostOf(request, env) {
  return env.PUBLIC_HOST || new URL(request.url).host;
}

async function requireAdmin(request, env) {
  const cookies = parseCookies(request.headers.get("Cookie") || "");
  const secret = env.SESSION_SECRET || "chop-dev-secret-change-me";
  return verifySessionCookie(cookies["chop_session"] || "", secret);
}

function setSessionCookie(resp, token) {
  resp.headers.append(
    "Set-Cookie",
    `chop_session=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 12}; Path=/`
  );
  return resp;
}

function clearSessionCookie(resp) {
  resp.headers.append("Set-Cookie", "chop_session=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/");
  return resp;
}

// ── config helpers ─────────────────────────────────────────────────────
function parseCleanIps(raw) {
  return String(raw || "")
    // به‌علاوه‌ی newline واقعی، «\n» literal (بک‌اسلش + n) که ممکنه از
    // API/ابزارهای خارجی برسه هم جداکننده حساب بشه.
    .split(/\\n|[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
const parseList = parseCleanIps; // نام عمومی‌تر، برای پروکسی‌ها هم استفاده می‌شه

// از کد کشور (۲ حرفی) ایموجی پرچم می‌سازه — بدون نیاز به لیست ثابت.
function publicConfig(config, host) {
  const links = buildLinks(config, host);
  return {
    id: config.id,
    name: config.name,
    uuid: config.uuid,
    enabled: config.enabled !== false,
    created_at: config.created_at,
    expires_at: config.expires_at,
    traffic_limit_bytes: config.traffic_limit_bytes || 0,
    used_bytes: config.used_bytes || 0,
    ip_limit: config.ip_limit || 0,
    fingerprint: config.fingerprint || "chrome",
    alpn: config.alpn || "http/1.1",
    port: config.port || 443,
    transport: config.transport || "ws",
    proxy: (config.proxies && config.proxies[0]) || config.proxy || "",
    proxies: config.proxies || (config.proxy ? [config.proxy] : []),
    clean_ips: config.clean_ips || [],
    location: config.location || "",
    ip_operator: config.ip_operator || "all",
    ip_count: config.ip_count || 20,
    auto_rotate_ip: !!config.auto_rotate_ip,
    rotate_minutes: config.rotate_minutes || 0,
    last_rotate_time: config.last_rotate_time || 0,
    blocklist: config.blocklist || [],
    link: links[0],
    links,
    sub_url: subscriptionUrl(config, host),
  };
}

// محتوای سابسکریپشن یک کانفیگ: همون buildLinks (یک لینک vless به ازای هر
// آی‌پی تمیز — دقیقاً همون کاری که پنل مبدا با «۱۰۰ کانفیگ روی آی‌پی‌های
// مختلف» انجام می‌داد)، Base64 شده طبق استاندارد subscription.
function buildSubscriptionResponse(config, host) {
  const links = buildLinks(config, host);
  const content = links.join("\n");
  const b64 = btoa(unescape(encodeURIComponent(content)));

  const usedBytes = Math.floor(config.used_bytes || 0);
  const totalBytes = config.traffic_limit_bytes || 0;
  const expire = config.expires_at ? Math.floor(config.expires_at) : 0;
  const userInfo = `upload=0; download=${usedBytes}; total=${totalBytes}; expire=${expire}`;

  return new Response(b64, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Subscription-Userinfo": userInfo,
      "Profile-Title": `base64:${btoa(unescape(encodeURIComponent(config.name)))}`,
      "Profile-Update-Interval": "6",
    },
  });
}

function botWebhookUrl(host, secret) {
  return `https://${host}/bot/webhook/${secret}`;
}

// ── چرخش خودکار «آی‌پی تمیز» (auto_rotate_ip) ──────────────────────────
// دقیقاً مثل سورس نمونه: فایلی با فرمت بلوک‌های جداشده با «----------» که
// هر بلوک یک خط «# نامِ‌گروه» و چند خط IP داره (خطوطی که با [source شروع
// می‌شن نادیده گرفته می‌شن). این تابع هم برای پیکر توی پنل استفاده می‌شه
// هم برای چرخشِ خودکار سمت سرور.
function parseIpBlocks(text) {
  const blocks = text.split("----------");
  const out = {};
  for (const block of blocks) {
    const lines = block
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) continue;
    let opName = "Unknown";
    const ips = [];
    for (const line of lines) {
      if (line.includes("#")) opName = line.split("#")[1].trim();
      else if (!line.startsWith("[source")) ips.push(line);
    }
    if (ips.length) out[opName] = ips;
  }
  return out;
}

function pickRandomN(arr, n) {
  const uniq = [...new Set(arr)];
  if (n >= uniq.length) return uniq;
  const shuffled = uniq.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

// در نسخه‌ی Vercel این تابع به‌ازای «هر ریکوئست» صداش زده می‌شد (چون پروسه‌ی
// درازمدتی وجود نداشت). روی Railway یک پروسه‌ی همیشه‌روشن داریم، پس setInterval
// سرورِ index.js چرخش رو مستقل اجرا می‌کنه و این نسخه فقط یک‌بار در دقیقه به‌عنوان
// fallback برایِ سازگاری باقی می‌مونه.
async function maybeRotateCleanIps(env) {
  try {
    const store = getStore();
    const now = Date.now();
    const lastCheck = parseInt((await store.getSetting("last_ip_rotate_check")) || "0", 10);
    if (now - lastCheck < 60000) return;
    await store.setSetting("last_ip_rotate_check", String(now));

    const configs = await store.listConfigs();
    const due = configs.filter(
      (c) => c.auto_rotate_ip && c.rotate_minutes > 0 && now >= (c.last_rotate_time || 0) + c.rotate_minutes * 60000
    );
    if (!due.length) return;

    const listUrl = (await store.getSetting("clean_ip_list_url")) || DEFAULT_CLEAN_IP_LIST_URL;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let text;
    try {
      const resp = await fetch(listUrl, { signal: controller.signal });
      if (!resp.ok) return;
      text = await resp.text();
    } finally {
      clearTimeout(timer);
    }
    const grouped = parseIpBlocks(text);

    for (const c of due) {
      let pool = [];
      if (c.ip_operator === "all" || !c.ip_operator) {
        for (const ips of Object.values(grouped)) pool = pool.concat(ips);
      } else {
        pool = grouped[c.ip_operator] || [];
      }
      const picked = pickRandomN(pool, c.ip_count || 20);
      if (!picked.length) continue;
      c.clean_ips = picked;
      c.last_rotate_time = now;
      delete c.used_bytes; // این فیلد مشتق‌شده‌ست و جدا زیر usage: ذخیره می‌شه
      await store.saveConfig(c);
    }
  } catch {
    /* چرخش خودکار نباید کل ریکوئست رو خراب کنه */
  }
}

// تایمر دوره‌ای چرخش خودکار (روی Railway یعنی واقعاً بدون نیاز به ریکوئست کار می‌کنه)
let _rotateTimerStarted = false;
function startRotateTimer() {
  if (_rotateTimerStarted) return;
  _rotateTimerStarted = true;
  // هر ۶۰ ثانیه یک‌بار چک می‌کنه؛ خود تابع داخلی نرخش رو محدود می‌کنه.
  setInterval(() => maybeRotateCleanIps(process.env).catch(() => {}), 60_000).unref();
}
startRotateTimer();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const store0 = getStore();
    // شمارش تقریبی درخواست‌ها برای مقایسه با سقف رایگان ۱۰۰٬۰۰۰ درخواست/روز
    // Cloudflare Workers؛ در پس‌زمینه انجام می‌شه تا هیچ تأخیری به پاسخ
    // (خصوصاً هندشیک /ws) اضافه نکنه.
    ctx.waitUntil(store0.bumpRequestCounter().catch(() => {}));
    ctx.waitUntil(maybeRotateCleanIps(env));

    try {
      // ── VLESS+WS relay ────────────────────────────────────────────
      // نکته: خودِ اتصال WebSocket هیچ‌وقت به این تابع نمی‌رسه — قبل از
      // اینجا، توی api/server.js با رویداد 'upgrade' گرفته و مستقیم به
      // wsrelay.js سپرده می‌شه. اگه اینجا سر از این مسیر دربیاریم یعنی
      // درخواست بدون هدر Upgrade درست فرستاده شده.
      if (path === WS_PATH) {
        return new Response("expected websocket upgrade", { status: 426 });
      }

      // ── health ─────────────────────────────────────────────────────
      if (path === "/api/health" && method === "GET") {
        return json({ ok: true, service: "chop" });
      }

      // ── کتابخانه‌ی QR (لوکال — بدون CDN خارجی) ────────────────────
      if (path === "/qrcode.min.js" && method === "GET") {
        const data = await fs.promises.readFile(new URL("../public/qrcode.min.js", import.meta.url));
        return new Response(data, {
          headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=86400" },
        });
      }

      // ── auth ───────────────────────────────────────────────────────
      // یوزر و پسورد پیش‌فرض هر دو «2010» هستند — نیازی به تنظیم env نیست.
      // برای امنیت بیشتر در محیط پروداکشن، ADMIN_USER و ADMIN_PASS رو ست کنید.
      if (path === "/api/login" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const username = body.username || "";
        const password = body.password || "";
        const adminUser = env.ADMIN_USER || "2010";
        const adminPass = env.ADMIN_PASS || "2010";

        if (username !== adminUser || password !== adminPass) {
          return errorJson(401, "نام کاربری یا رمز عبور اشتباه است");
        }
        const secret = env.SESSION_SECRET || "chop-dev-secret-change-me";
        const token = await createSessionCookie(username, secret);
        return setSessionCookie(json({ ok: true }), token);
      }

      if (path === "/api/logout" && method === "POST") {
        return clearSessionCookie(json({ ok: true }));
      }

      // ── pages ──────────────────────────────────────────────────────
      if (path === "/" && method === "GET") {
        if (await requireAdmin(request, env)) {
          return Response.redirect(url.origin + "/dashboard", 302);
        }
        return html(ui.loginPage());
      }

      if (path === "/dashboard" && method === "GET") {
        if (!(await requireAdmin(request, env))) {
          return Response.redirect(url.origin + "/", 302);
        }
        return html(ui.dashboardPage());
      }

      // ── bot webhook (باید قبل از چک ادمین باشه، چون تلگرام صدا می‌زنه) ─
      if (path.startsWith("/bot/webhook/") && method === "POST") {
        const secretFromPath = path.slice("/bot/webhook/".length);
        const store = getStore();
        const settings = await store.getBotSettings();
        if (!settings.enabled || !settings.token || secretFromPath !== settings.secret) {
          return json({ ok: true });
        }
        const update = await request.json().catch(() => ({}));
        await bot.handleUpdate(store, settings.token, update, hostOf(request, env));
        return json({ ok: true });
      }

      // ── سابسکریپشن (عمومی، بدون نیاز به لاگین — کلاینت‌های vless صداش می‌زنن) ─
      if (path.startsWith("/sub/") && method === "GET") {
        const uuid = path.slice("/sub/".length);
        const store = getStore();
        const cfg = await store.getConfigByUuid(uuid);
        if (!cfg || cfg.enabled === false) {
          return new Response("not found", { status: 404 });
        }
        return buildSubscriptionResponse(cfg, hostOf(request, env));
      }

      // ── همه‌ی مسیرهای زیر نیاز به ادمین دارند ─────────────────────
      if (path.startsWith("/api/")) {
        if (!(await requireAdmin(request, env))) {
          return errorJson(401, "unauthorized");
        }
      }

      const store = getStore();
      const host = hostOf(request, env);

      if (path === "/api/test-clean-ip" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const ip = String(body.ip || "").trim();
        if (!ip) return errorJson(400, "آی‌پی وارد نشده است");
        const result = await testOneIp(host, ip, 6000);
        return json(result);
      }

      // اسکن خودکار: به‌جای وابستگی به یه لیست/سرور شخص‌ثالث، خودِ Worker از
      // رنج‌های رسمی Cloudflare آی‌پی تصادفی می‌سازه، هرکدوم رو با همون روش
      // resolveOverride تست می‌کنه، و سریع‌ترین‌هایی که واقعاً از این شبکه
      // جواب داده باشن رو برمی‌گردونه.
      if (path === "/api/scan-clean-ips" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        let want = parseInt(body.want, 10);
        if (!Number.isFinite(want) || want < 1) want = 10;
        want = Math.min(want, 50);
        let candidates = parseInt(body.candidates, 10);
        if (!Number.isFinite(candidates) || candidates < want) candidates = Math.max(want * 6, 60);
        candidates = Math.min(candidates, 300);
        const provider = body.provider === "vercel" ? "vercel" : "cloudflare";
        if (provider === "vercel") want = Math.min(want, VERCEL_IPV4_CANDIDATES.length);
        const result = await scanCleanIps({ host, want, candidates, concurrency: 10, timeoutMs: 4000, deadlineMs: 25000, provider });
        return json({ ...result, provider });
      }

      const DEFAULT_PROXY_LIST_URL = "https://hoplimit.shop/proxy_vip/{country}.txt";

      if (path === "/api/proxy-list-url" && method === "GET") {
        const listUrl = (await store.getSetting("proxy_list_url")) || DEFAULT_PROXY_LIST_URL;
        return json({ url: listUrl });
      }

      if (path === "/api/proxy-list-url" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const listUrl = (body.url || "").trim();
        await store.setSetting("proxy_list_url", listUrl);
        return json({ ok: true });
      }

      // لیست پروکسی‌ها رو سمت سرور می‌گیره (نه از مرورگر ادمین) تا هم CORS
      // مشکل نشه و هم آدرس واقعی سرویس فقط پیش خودِ ورکر بمونه.
      // اگه آدرس ذخیره‌شده شامل {country} باشه، طبق کشورِ انتخابی جایگزین
      // می‌شه (دقیقاً مثل فایل‌های جدا به ازای هر کشور در پروژه‌ی نمونه).
      if (path === "/api/proxy-list" && method === "GET") {
        let listUrl = (await store.getSetting("proxy_list_url")) || DEFAULT_PROXY_LIST_URL;
        if (!listUrl) return errorJson(400, "اول آدرس لیست پروکسی رو در همین بخش تنظیم کن");
        const country = (url.searchParams.get("country") || "ALL").trim().toUpperCase();
        listUrl = listUrl.includes("{country}") ? listUrl.replace("{country}", country) : listUrl;
        let text;
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 8000);
          let resp;
          try {
            resp = await fetch(listUrl, { signal: controller.signal });
          } finally {
            clearTimeout(timer);
          }
          if (!resp.ok) return errorJson(400, "دریافت لیست ناموفق بود (کد " + resp.status + ")");
          text = await resp.text();
        } catch (e) {
          return errorJson(400, "خطا در دریافت لیست: " + (e && e.message ? e.message : "نامشخص"));
        }
        const proxies = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith("#"))
          .slice(0, 500);
        return json({ proxies, country });
      }

      // ── لیست «آی‌پی تمیز» — دقیقاً فرمت ips.txt سورس نمونه: بلوک‌های جدا
      // با «----------»، هر بلوک یک خط «# نام‌گروه» + چند خط IP ─────────
      if (path === "/api/clean-ip-list-url" && method === "GET") {
        const listUrl = (await store.getSetting("clean_ip_list_url")) || DEFAULT_CLEAN_IP_LIST_URL;
        return json({ url: listUrl });
      }

      if (path === "/api/clean-ip-list-url" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const listUrl = (body.url || "").trim();
        await store.setSetting("clean_ip_list_url", listUrl);
        return json({ ok: true });
      }

      if (path === "/api/clean-ip-list" && method === "GET") {
        const listUrl = (await store.getSetting("clean_ip_list_url")) || DEFAULT_CLEAN_IP_LIST_URL;
        if (!listUrl) return errorJson(400, "اول آدرس لیست آی‌پی تمیز رو تنظیم کن");
        let text;
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 8000);
          let resp;
          try {
            resp = await fetch(listUrl, { signal: controller.signal });
          } finally {
            clearTimeout(timer);
          }
          if (!resp.ok) return errorJson(400, "دریافت لیست ناموفق بود (کد " + resp.status + ")");
          text = await resp.text();
        } catch (e) {
          return errorJson(400, "خطا در دریافت لیست: " + (e && e.message ? e.message : "نامشخص"));
        }
        const operators = parseIpBlocks(text);
        return json({ operators });
      }

      if (path === "/api/configs" && method === "GET") {
        const configs = await store.listConfigs();
        const onlineCounts = await store.onlineIpCountsForAll();
        const out = configs.map((c) => {
          const item = publicConfig(c, host);
          item.online = onlineCounts[c.id] || 0;
          return item;
        });
        return json({ configs: out });
      }

      if (path === "/api/configs" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const name = (body.name || "").trim();
        if (!name) return errorJson(400, "نام کانفیگ الزامی است");

        const trafficLimitGb = parseFloat(body.traffic_limit_gb || 0);
        const expiresDays = parseInt(body.expires_days || 0, 10);

        const config = {
          id: await store.newId(),
          name,
          uuid: crypto.randomUUID(),
          enabled: true,
          created_at: Date.now() / 1000,
          expires_at: expiresDays ? Date.now() / 1000 + expiresDays * 86400 : null,
          traffic_limit_bytes: Math.trunc(trafficLimitGb * 1024 * 1024 * 1024),
          ip_limit: parseInt(body.ip_limit || 0, 10),
          fingerprint: body.fingerprint || "chrome",
          alpn: body.alpn || "http/1.1",
          port: parseInt(body.port || 443, 10),
          transport: ["ws", "xhttp"].includes(body.transport) ? body.transport : "ws",
          proxy: "",
          proxies: parseList(body.proxies || body.proxy),
          clean_ips: parseCleanIps(body.clean_ips).length ? parseCleanIps(body.clean_ips) : DEFAULT_CLEAN_IPS,
          location: (body.location || "").trim().toUpperCase(),
          ip_operator: (body.ip_operator || "all").trim() || "all",
          ip_count: parseInt(body.ip_count || 20, 10),
          auto_rotate_ip: !!body.auto_rotate_ip,
          rotate_minutes: parseInt(body.rotate_minutes || 0, 10),
          last_rotate_time: Date.now(),
          blocklist: parseList(body.blocklist),
        };
        await store.saveConfig(config);
        return json(publicConfig(config, host));
      }

      const configIdMatch = path.match(/^\/api\/configs\/([^/]+)$/);
      if (configIdMatch && method === "PATCH") {
        const configId = configIdMatch[1];
        const config = await store.getConfig(configId);
        if (!config) return errorJson(404, "یافت نشد");

        const body = await request.json().catch(() => ({}));
        if ("enabled" in body) config.enabled = !!body.enabled;
        if ("name" in body && body.name.trim()) config.name = body.name.trim();
        if ("traffic_limit_gb" in body) {
          config.traffic_limit_bytes = Math.trunc(parseFloat(body.traffic_limit_gb) * 1024 * 1024 * 1024);
        }
        if ("expires_days" in body) {
          const expiresDays = parseInt(body.expires_days || 0, 10);
          config.expires_at = expiresDays ? Date.now() / 1000 + expiresDays * 86400 : null;
        }
        if ("ip_limit" in body) config.ip_limit = parseInt(body.ip_limit, 10);
        if ("fingerprint" in body) config.fingerprint = body.fingerprint;
        if ("alpn" in body) config.alpn = body.alpn;
        if ("port" in body) config.port = parseInt(body.port, 10);
        if ("transport" in body && ["ws", "xhttp"].includes(body.transport)) config.transport = body.transport;
        if ("proxies" in body || "proxy" in body) config.proxies = parseList(body.proxies || body.proxy);
        if ("clean_ips" in body) {
          config.clean_ips = parseCleanIps(body.clean_ips);
          config.last_rotate_time = Date.now(); // تازه‌سازی دستی = مبدأ جدید برای چرخش خودکار بعدی
        }
        if ("location" in body) config.location = (body.location || "").trim().toUpperCase();
        if ("ip_operator" in body) config.ip_operator = (body.ip_operator || "all").trim() || "all";
        if ("ip_count" in body) config.ip_count = parseInt(body.ip_count || 20, 10);
        if ("auto_rotate_ip" in body) config.auto_rotate_ip = !!body.auto_rotate_ip;
        if ("rotate_minutes" in body) config.rotate_minutes = parseInt(body.rotate_minutes || 0, 10);
        if ("blocklist" in body) config.blocklist = parseList(body.blocklist);
        await store.saveConfig(config);
        if (body.reset_usage) {
          await store.resetUsage(configId);
          config.used_bytes = 0;
        }
        const fresh = await store.getConfig(configId);
        return json(publicConfig(fresh, host));
      }

      if (configIdMatch && method === "DELETE") {
        await store.deleteConfig(configIdMatch[1]);
        return json({ ok: true });
      }

      if (path === "/api/stats" && method === "GET") {
        const configs = await store.listConfigs();
        const onlineCounts = await store.onlineIpCountsForAll();
        const totalOnline = Object.values(onlineCounts).reduce((s, n) => s + n, 0);
        const series = await store.getTrafficSeries(24);
        const totalUsed = configs.reduce((sum, c) => sum + (c.used_bytes || 0), 0);
        const requestsToday = await store.getRequestCounter();
        const requestsHistory = await store.getRequestCounterHistory(7);
        const requestsLimitSetting = await store.getSetting("daily_request_limit");
        const requestsLimit = requestsLimitSetting ? parseInt(requestsLimitSetting, 10) : DEFAULT_DAILY_REQUEST_LIMIT;
        const nowSec = Date.now() / 1000;
        const activeConfigs = configs.filter((c) => c.enabled !== false && (!c.expires_at || c.expires_at > nowSec));
        const trafficLimitTotal = configs.reduce((s, c) => s + (c.traffic_limit_bytes || 0), 0);
        return json({
          config_count: configs.length,
          active_configs: activeConfigs.length,
          online: totalOnline,
          total_used_bytes: totalUsed,
          total_limit_bytes: trafficLimitTotal,
          traffic_series: series,
          backend: await store.healthBackend(),
          requests_today: requestsToday,
          requests_limit: requestsLimit,
          requests_history: requestsHistory,
          uptime_sec: Math.floor(process.uptime()),
        });
      }

      if (path === "/api/request-limit" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const limit = parseInt(body.limit, 10);
        if (!Number.isFinite(limit) || limit < 1) return errorJson(400, "مقدار سقف نامعتبر است");
        await store.setSetting("daily_request_limit", String(limit));
        return json({ ok: true });
      }

      // ── system info: وضعیت منابع سرور برای داشبورد ──────────────────
      if (path === "/api/system-info" && method === "GET") {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memPercent = totalMem > 0 ? (usedMem / totalMem) * 100 : 0;
        const cpus = os.cpus();
        let loadAvg = [];
        try { loadAvg = os.loadavg().slice(0, 3); } catch { loadAvg = []; }
        return json({
          uptime_sec: Math.floor(process.uptime()),
          mem_percent: Math.round(memPercent * 10) / 10,
          mem_total_bytes: totalMem,
          mem_used_bytes: usedMem,
          cpu_count: cpus.length || 1,
          cpu_model: cpus.length ? cpus[0].model : "unknown",
          load_avg: loadAvg,
          ws_connections: getActiveSessionCount(),
          node_version: process.versions.node,
          platform: process.platform,
          arch: process.arch,
          hostname: os.hostname(),
        });
      }

      if (path === "/api/logs" && method === "GET") {
        const configId = url.searchParams.get("config_id") || null;
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 300);
        const logs = await store.getLogs(configId, limit);
        return json({ logs });
      }

      if (path === "/api/bot/settings" && method === "GET") {
        const settings = await store.getBotSettings();
        const admins = await store.listBotAdmins();
        const members = await store.listBotMembers();
        const token = settings.token;
        const masked = token.length > 10 ? `${token.slice(0, 6)}…${token.slice(-4)}` : token ? "•••" : "";
        return json({
          enabled: settings.enabled,
          token_set: !!token,
          token_masked: masked,
          webhook_url: settings.secret ? botWebhookUrl(host, settings.secret) : null,
          admins,
          member_count: members.length,
        });
      }

      if (path === "/api/bot/settings" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const current = await store.getBotSettings();
        const token = (body.token || "").trim() || current.token;
        const enabled = "enabled" in body ? !!body.enabled : current.enabled;

        if (!token) return errorJson(400, "توکن ربات را وارد کنید");

        const secret = await bot.makeSecret(token);
        await store.saveBotSettings(token, enabled, secret);

        const webhookUrl = botWebhookUrl(host, secret);
        if (enabled) {
          const result = await bot.setWebhook(token, webhookUrl, secret);
          if (!result.ok) {
            return errorJson(400, `خطا در تنظیم Webhook: ${result.description || "نامشخص"}`);
          }
        } else {
          await bot.deleteWebhook(token);
        }
        return json({ ok: true, webhook_url: enabled ? webhookUrl : null });
      }

      if (path === "/api/bot/members" && method === "GET") {
        return json({ members: await store.listBotMembers() });
      }

      if (path === "/api/bot/broadcast" && method === "POST") {
        const settings = await store.getBotSettings();
        if (!settings.token) return errorJson(400, "اول توکن ربات رو تنظیم کن");
        const body = await request.json().catch(() => ({}));
        const text = (body.text || "").trim();
        if (!text) return errorJson(400, "متن پیام خالیه");

        let chatIds;
        if (Array.isArray(body.target)) {
          chatIds = body.target.map(String).filter((id) => /^\d+$/.test(id));
        } else if (body.target === "admins") {
          const admins = await store.listBotAdmins();
          chatIds = admins.map((a) => a.id);
        } else {
          const members = await store.listBotMembers();
          chatIds = members.map((m) => m.id);
        }
        if (!chatIds.length) return errorJson(400, "هیچ مخاطبی برای ارسال پیدا نشد");
        if (chatIds.length > 5000) return errorJson(400, "حداکثر ۵۰۰۰ نفر در هر بار (محدودیتِ زمانِ اجرا)");

        const result = await bot.sendBroadcast(settings.token, chatIds, text);
        for (const tgId of result.blocked) {
          await store.removeBotMember(tgId).catch(() => {});
        }
        return json({ ok: true, sent: result.sent, failed: result.failed, removed: result.blocked.length });
      }

      if (path === "/api/bot/admins" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const tgId = String(body.id || "").trim();
        if (!/^\d+$/.test(tgId)) return errorJson(400, "آی‌دی عددی تلگرام را وارد کنید");
        await store.addBotAdmin(tgId, "panel");
        return json({ ok: true });
      }

      const botAdminMatch = path.match(/^\/api\/bot\/admins\/([^/]+)$/);
      if (botAdminMatch && method === "DELETE") {
        await store.removeBotAdmin(botAdminMatch[1]);
        return json({ ok: true });
      }

      if (path === "/api/backup" && method === "GET") {
        const data = await store.exportAll();
        const filename = `chop-backup-${Math.floor(Date.now() / 1000)}.json`;
        return json(data, { headers: { "Content-Disposition": `attachment; filename="${filename}"` } });
      }

      if (path === "/api/backup/restore" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const backupData = body.backup;
        const mode = body.mode || "replace";
        if (!["replace", "merge"].includes(mode)) return errorJson(400, "mode باید replace یا merge باشد");
        if (!backupData || typeof backupData !== "object") return errorJson(400, "فایل بکاپ معتبر نیست");

        let counters;
        try {
          counters = await store.importAll(backupData, mode);
        } catch (e) {
          return errorJson(400, e.message || "فایل بکاپ معتبر نیست");
        }

        const settings = await store.getBotSettings();
        let webhookUrl = null;
        if (settings.enabled && settings.token) {
          webhookUrl = botWebhookUrl(host, settings.secret);
          const result = await bot.setWebhook(settings.token, webhookUrl, settings.secret);
          if (!result.ok) webhookUrl = null;
        }
        return json({ ok: true, counters, webhook_url: webhookUrl });
      }

      return new Response("Not found", { status: 404 });
    } catch (err) {
      return errorJson(500, err && err.message ? err.message : "internal error");
    }
  },
};
