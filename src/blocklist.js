/**
 * blocklist.js — چک اینکه آیا مقصدِ یک درخواستِ VLESS (که می‌تونه IP یا
 * دامنه باشه) توی لیست مسدودشده‌ی یک کانفیگ هست یا نه.
 *
 * فرمت‌های پشتیبانی‌شده در هر خط از لیست:
 *   - آی‌پی دقیق:      1.2.3.4
 *   - رنج CIDR:        1.2.3.0/24
 *   - دامنه:           example.com   (زیردامنه‌هاش هم مسدود می‌شن)
 *   - دامنه با *:      *.example.com (همون معنی بالا)
 */

function isIpv4(str) {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(str);
}

function ipv4ToInt(ip) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function ipv4MatchesEntry(ip, entry) {
  if (entry.includes("/")) {
    const [base, prefixStr] = entry.split("/");
    const prefix = parseInt(prefixStr, 10);
    if (!isIpv4(base) || Number.isNaN(prefix) || prefix < 0 || prefix > 32) return false;
    const ipInt = ipv4ToInt(ip);
    const baseInt = ipv4ToInt(base);
    if (ipInt === null || baseInt === null) return false;
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    return (ipInt & mask) === (baseInt & mask);
  }
  return isIpv4(entry) && ip === entry;
}

function domainMatchesEntry(domain, entry) {
  const d = domain.toLowerCase();
  let e = entry.toLowerCase();
  if (e.startsWith("*.")) e = e.slice(2);
  if (!e) return false;
  return d === e || d.endsWith("." + e);
}

/**
 * @param {string} address - مقصدِ پارس‌شده از هدر VLESS (IPv4 / IPv6 / دامنه)
 * @param {string[]} blocklist - لیست ورودی‌های مسدودشده‌ی یک کانفیگ
 * @returns {boolean}
 */
export function isBlocked(address, blocklist) {
  if (!address || !Array.isArray(blocklist) || !blocklist.length) return false;
  const target = String(address).trim();
  if (!target) return false;
  const isIpv6 = target.includes(":");
  const isIp = isIpv4(target) || isIpv6;

  for (const raw of blocklist) {
    const entry = String(raw || "").trim();
    if (!entry) continue;

    if (isIp) {
      if (isIpv4(target)) {
        if (ipv4MatchesEntry(target, entry)) return true;
      } else if (isIpv6 && entry.includes(":") && target.toLowerCase() === entry.toLowerCase()) {
        return true; // IPv6: فقط تطابق دقیق، بدون پشتیبانی از رنج
      }
    } else if (!isIpv4(entry) && !entry.includes("/") && !entry.includes(":")) {
      // ورودی‌ای که خودش IP/CIDR نیست، به‌عنوان دامنه در نظر گرفته می‌شه
      if (domainMatchesEntry(target, entry)) return true;
    }
  }
  return false;
}
