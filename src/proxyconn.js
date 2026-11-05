/**
 * proxyconn.js — اتصال خروجی Chop، با پشتیبانی اختیاری از پروکسی SOCKS5/HTTP
 *
 * اگر روی کانفیگ یک آدرس پروکسی ست شده باشه (فیلد `proxy`، مثل
 * socks5://user:pass@1.2.3.4:1080 یا http://1.2.3.4:8080)، اتصال خروجی به
 * مقصد VLESS از طریق اون پروکسی برقرار می‌شه؛ در غیر این صورت مستقیم با
 * connect() بومی Workers وصل می‌شه.
 */
import { connect } from "./node-socket.js";

const PROXY_URL_RE = /^(socks5|socks|http|https):\/\/(?:([^:@/]+):([^@/]*)@)?([^:/]+):(\d+)\/?$/i;

export async function connectUpstream(config, address, port) {
  const list =
    Array.isArray(config && config.proxies) && config.proxies.length
      ? config.proxies
      : config && config.proxy
      ? [config.proxy]
      : [];
  const proxyUrl = list.length ? String(list[Math.floor(Math.random() * list.length)]).trim() : "";

  if (!proxyUrl) {
    return connect({ hostname: address, port });
  }

  const m = proxyUrl.match(PROXY_URL_RE);
  if (!m) throw new Error("آدرس پروکسی نامعتبر است");
  const [, schemeRaw, user, pass, proxyHost, proxyPortStr] = m;
  const scheme = schemeRaw.toLowerCase();
  const proxyPort = parseInt(proxyPortStr, 10);

  const socket = connect({ hostname: proxyHost, port: proxyPort });
  const reader = socket.readable.getReader();

  let leftover;
  try {
    if (scheme === "socks5" || scheme === "socks") {
      leftover = await socks5Handshake(socket, reader, address, port, user, pass);
    } else {
      leftover = await httpConnectHandshake(socket, reader, address, port, user, pass);
    }
  } catch (e) {
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
    throw e;
  }

  // مهم: بعضی سرورها بلافاصله بعد از برقراری تونل داده می‌فرستن که ممکنه
  // توی همون chunkِ پاسخِ هندشیک هم اومده باشه. اگه اون بایت‌های اضافه رو
  // دور بریزیم، ابتدای پاسخ واقعیِ مقصد گم می‌شه. برای همین reader رو آزاد
  // نمی‌کنیم و به‌جاش یک ReadableStream جدید می‌سازیم که اول همون باقیمانده
  // رو تحویل می‌ده و بعد از همون reader ادامه می‌ده — طوری که wsrelay.js
  // (که socket.readable.getReader() صدا می‌زنه) هیچ بایتی رو از دست نده.
  const wrappedReadable = new ReadableStream({
    start(controller) {
      if (leftover && leftover.length) controller.enqueue(leftover);
    },
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(value);
    },
    cancel(reason) {
      try {
        reader.cancel(reason);
      } catch {
        /* ignore */
      }
    },
  });

  return {
    readable: wrappedReadable,
    writable: socket.writable,
    close: () => socket.close(),
  };
}

async function readExact(reader, n, leftover) {
  const chunks = leftover && leftover.length ? [leftover] : [];
  let total = chunks.reduce((s, c) => s + c.length, 0);
  while (total < n) {
    const { value, done } = await reader.read();
    if (done) throw new Error("اتصال پروکسی به‌طور غیرمنتظره بسته شد");
    chunks.push(value);
    total += value.length;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return { data: out.subarray(0, n), rest: out.subarray(n) };
}

// برمی‌گردونه: بایت‌های اضافه‌ای که بعد از پاسخ هندشیک SOCKS5 خونده شده و
// متعلق به داده‌ی واقعیِ تونل هستن (leftover) — نه دور ریخته می‌شن.
async function socks5Handshake(socket, reader, address, port, user, pass) {
  const writer = socket.writable.getWriter();
  try {
    const authMethods = user ? [0x00, 0x02] : [0x00];
    await writer.write(new Uint8Array([0x05, authMethods.length, ...authMethods]));

    let r = await readExact(reader, 2, new Uint8Array(0));
    if (r.data[0] !== 0x05) throw new Error("پاسخ SOCKS5 نامعتبر است");

    if (r.data[1] === 0x02) {
      if (!user) throw new Error("این پروکسی نیاز به نام‌کاربری/رمز دارد");
      const u = new TextEncoder().encode(user);
      const p = new TextEncoder().encode(pass || "");
      await writer.write(new Uint8Array([0x01, u.length, ...u, p.length, ...p]));
      r = await readExact(reader, 2, r.rest);
      if (r.data[1] !== 0x00) throw new Error("احراز هویت پروکسی ناموفق بود");
    } else if (r.data[1] !== 0x00) {
      throw new Error("پروکسی هیچ روش احراز هویت قابل‌قبولی نپذیرفت");
    }

    const addrBytes = new TextEncoder().encode(address);
    const req = new Uint8Array([0x05, 0x01, 0x00, 0x03, addrBytes.length, ...addrBytes, (port >> 8) & 0xff, port & 0xff]);
    await writer.write(req);

    r = await readExact(reader, 4, r.rest);
    if (r.data[1] !== 0x00) throw new Error("پروکسی اتصال را رد کرد (کد " + r.data[1] + ")");
    const atyp = r.data[3];
    if (atyp === 0x01) r = await readExact(reader, 4 + 2, r.rest);
    else if (atyp === 0x04) r = await readExact(reader, 16 + 2, r.rest);
    else if (atyp === 0x03) {
      const lenR = await readExact(reader, 1, r.rest);
      r = await readExact(reader, lenR.data[0] + 2, lenR.rest);
    }
    return r.rest;
  } finally {
    writer.releaseLock();
  }
}

// برمی‌گردونه: هر بایت اضافه‌ای که بعد از \r\n\r\n خونده شده (شروع داده‌ی
// واقعیِ تونل) — نه دور ریخته می‌شه.
async function httpConnectHandshake(socket, reader, address, port, user, pass) {
  const writer = socket.writable.getWriter();
  try {
    let req = `CONNECT ${address}:${port} HTTP/1.1\r\nHost: ${address}:${port}\r\n`;
    if (user) {
      req += `Proxy-Authorization: Basic ${btoa(`${user}:${pass || ""}`)}\r\n`;
    }
    req += `Connection: keep-alive\r\n\r\n`;
    await writer.write(new TextEncoder().encode(req));

    let buf = new Uint8Array(0);
    let headerEnd = -1;
    while (headerEnd === -1) {
      const { value, done } = await reader.read();
      if (done) break;
      const merged = new Uint8Array(buf.length + value.length);
      merged.set(buf, 0);
      merged.set(value, buf.length);
      buf = merged;
      const text = new TextDecoder().decode(buf);
      const idx = text.indexOf("\r\n\r\n");
      if (idx !== -1) headerEnd = new TextEncoder().encode(text.slice(0, idx)).length + 4;
    }
    const headerBytes = headerEnd === -1 ? buf : buf.subarray(0, headerEnd);
    const rest = headerEnd === -1 ? new Uint8Array(0) : buf.subarray(headerEnd);
    const statusLine = new TextDecoder().decode(headerBytes).split("\r\n")[0] || "";
    const statusCode = parseInt(statusLine.split(" ")[1], 10);
    if (!(statusCode >= 200 && statusCode < 300)) {
      throw new Error("پروکسی HTTP خطا داد: " + statusLine);
    }
    return rest;
  } finally {
    writer.releaseLock();
  }
}
