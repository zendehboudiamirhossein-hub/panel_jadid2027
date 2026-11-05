/**
 * node-socket.js — جایگزین `cloudflare:sockets` برای Node.js/Vercel
 *
 * proxyconn.js انتظار یک شیء با `.readable`/`.writable` (Web Streams
 * استاندارد، همون‌طور که `cloudflare:sockets`.connect() برمی‌گردونه) و
 * `.close()` داره. اینجا همون شکل رو با یک TCP socket خام Node.js
 * (`net.connect`) و توابع تبدیل استاندارد `node:stream/web` می‌سازیم، تا
 * proxyconn.js بدون هیچ تغییری روی هر دو پلتفرم کار کنه.
 */
import net from "node:net";
import { Duplex } from "node:stream";

export function connect({ hostname, port }) {
  const sock = net.connect({ host: hostname, port, allowHalfOpen: true });
  sock.setNoDelay(true);
  // تایم‌اوت اتصال: بدون این، مقصدِ غیرپاسخگو تا تایم‌اوت سیستم‌عامل (دقیقه‌ها) آویزون می‌مونه
  const connectTimer = setTimeout(() => sock.destroy(new Error("connect timeout")), 10000);
  sock.once("connect", () => clearTimeout(connectTimer));
  sock.once("close", () => clearTimeout(connectTimer));
  // جلوگیری از کرش پروسه به‌خاطر 'error'ِ بدون listener (مثلاً ECONNRESET)
  sock.on("error", () => {});
  sock.setKeepAlive(true, 30000); // هر ۳۰ ثانیه یه پکت keepalive: جلوی قطع خاموشِ اتصالِ بی‌کار توسط فایروال/NAT بین راه رو می‌گیره (که وگرنه باعث قطعی و اتصال مجدد کند می‌شد)

  // Duplex.toWeb یک تبدیل هماهنگ (نه دو تبدیل جدا روی همون stream) و دقیقاً
  // برای همین حالت — یک duplex واحد مثل net.Socket — ساخته شده.
  const { readable, writable } = Duplex.toWeb(sock);

  return {
    readable,
    writable,
    close: () =>
      new Promise((resolve) => {
        if (sock.destroyed) return resolve();
        sock.end(() => resolve());
        sock.once("error", () => resolve());
      }),
  };
}
