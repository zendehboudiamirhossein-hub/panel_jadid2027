/**
 * linkbuilder.js — منطق مشترک ساخت لینک vless/سابسکریپشن
 *
 * قبلاً index.js و bot.js هرکدوم یک نسخه‌ی جدا از این منطق داشتن؛ نتیجه‌ش
 * این بود که وقتی «آی‌پی تمیز»/پروکسی/لوکیشن به کانفیگ‌ها اضافه شد، فقط
 * پنل وب به‌روز شد و ربات تلگرام همچنان لینک قدیمی (تک‌آدرسی، بدون برچسب)
 * می‌ساخت. برای اینکه این‌جور واگرایی دیگه پیش نیاد، هر دو از همینجا
 * استفاده می‌کنن.
 */
const WS_PATH = "/ws";

// آی‌پی‌های تمیز پیش‌فرض: وقتی کانفیگ جدیدی بدون آی‌پی تمیز ساخته می‌شه
// (از پنل، API یا ربات)، این‌ها به‌عنوان آدرس اتصال استفاده می‌شن —
// به‌جای این‌که لینک مستقیم به دامنه‌ی خود ورکر بخوره.
export const DEFAULT_CLEAN_IPS = ["69.46.46.57", "69.46.46.50"];

// از کد کشور (۲ حرفی) ایموجی پرچم می‌سازه — بدون نیاز به لیست ثابت.
export function flagEmoji(cc) {
  if (!cc) return "🌐";
  const up = String(cc).toUpperCase().replace(/[^A-Z]/g, "");
  if (up.length !== 2) return "🌐";
  const points = [...up].map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...points);
}

// یک لینک vless برای هر «آی‌پی تمیز» می‌سازه (اگه ست نشده باشه، خودِ دامنه‌ی
// ورکر به‌عنوان آدرس استفاده می‌شه). SNI/Host همیشه دامنه‌ی ورکر می‌مونه چون
// روتینگ TLS/کلادفلر بر همون اساسه؛ فقط آدرس مقصدی که کلاینت بهش وصل می‌شه
// عوض می‌شه. اگه روی کانفیگ لوکیشن ست شده باشه، پرچم/کدِ کشور به اسمِ لینک
// هم اضافه می‌شه تا با پروکسی‌های انتخاب‌شده‌ی همون کشور «هماهنگ» باشه.
export function buildLinks(config, host) {
  const fp = config.fingerprint || "chrome";
  const alpn = config.alpn || "http/1.1";
  const port = config.port || 443;
  const cleanIps =
    Array.isArray(config.clean_ips) && config.clean_ips.length ? config.clean_ips : DEFAULT_CLEAN_IPS;
  const params =
    `type=ws&path=${encodeURIComponent(WS_PATH)}&host=${host}` +
    `&security=tls&sni=${host}&fp=${fp}&alpn=${encodeURIComponent(alpn)}`;
  const locTag = config.location ? `${flagEmoji(config.location)} ${config.location} ` : "";
  return cleanIps.map((addr) => {
    const label = cleanIps.length > 1 ? `${locTag}${config.name} | ${addr}` : `${locTag}${config.name}`;
    const remark = encodeURIComponent(label);
    return `vless://${config.uuid}@${addr}:${port}?${params}#${remark}`;
  });
}

export function subscriptionUrl(config, host) {
  return `https://${host}/sub/${config.uuid}`;
}
