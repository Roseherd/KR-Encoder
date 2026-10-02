// Reference implementation of the KR Encoder web app ciphers (spec section 5).
// Pure ES module: works in browsers and Node 20+ (uses globalThis.crypto.subtle).

const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder();
const dec = new TextDecoder('utf-8', { fatal: true });

// ---- integer keys: Python int() rules, ASCII digits only ----
export function parseIntKey(s) {
  const t = s.trim();
  if (!/^[+-]?[0-9]+(_[0-9]+)*$/.test(t)) throw new Error(`Key must be a whole number, got '${s}'`);
  return BigInt(t.replace(/_/g, ''));
}

const mod = (a, n) => ((a % n) + n) % n;

// ---- Caesar: shifts ASCII letters only ----
export function caesar(text, key, mode) {
  let s = Number(mod(BigInt(key), 26n));
  if (mode === 'decrypt') s = (26 - s) % 26;
  let out = '';
  for (const c of text) {
    const o = c.codePointAt(0);
    if (o >= 97 && o <= 122) out += String.fromCharCode(((o - 97 + s) % 26) + 97);
    else if (o >= 65 && o <= 90) out += String.fromCharCode(((o - 65 + s) % 26) + 65);
    else out += c;
  }
  return out;
}

// ---- Vigenere over printable ASCII (unchanged from the original app) ----
export function vigenere(text, key, mode) {
  const k = Array.from(key.toLowerCase());
  let ki = 0;
  let out = '';
  for (const c of text) {
    const o = c.codePointAt(0);
    if (o >= 32 && o <= 126) {
      if (k.length === 0) throw new Error('Vigenere key cannot be empty');
      const shift = k[ki % k.length].codePointAt(0) - 97;
      const pos = mode === 'encrypt' ? o - 32 + shift : o - 32 - shift;
      out += String.fromCharCode(mod(pos, 95) + 32);
      ki++;
    } else {
      out += c;
    }
  }
  return out;
}

// ---- Columnar transposition with a correct decrypt ----
export function transposition(text, key, mode) {
  const k = Number(key);
  if (!Number.isSafeInteger(k) || k < 1) throw new Error('Transposition key must be a whole number of 1 or more');
  const t = Array.from(text);
  const n = t.length;
  if (mode === 'encrypt') {
    let out = '';
    for (let c = 0; c < k; c++) for (let p = c; p < n; p += k) out += t[p];
    return out;
  }
  const res = new Array(n);
  let p = 0;
  for (let c = 0; c < Math.min(k, n); c++) {
    for (let pos = c; pos < n; pos += k) res[pos] = t[p++];
  }
  return res.join('');
}

// ---- Base64 helpers (standard alphabet, padded) ----
// Built in 32 KB chunks: spreading a whole large array into fromCharCode overflows the call stack
// (above ~65,000 bytes in Safari, ~125,000 in Chrome). Output is the same as a single call.
const toB64 = (bytes) => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
function fromB64(s) {
  const clean = s.replace(/[^A-Za-z0-9+/=]/g, '');
  try {
    return Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));
  } catch {
    throw new Error('Input is not valid Base64');
  }
}

// ---- AES-CBC, random IV, output Base64(IV || ciphertext) ----
async function aesKey(key) {
  const raw = enc.encode(key);
  if (![16, 24, 32].includes(raw.length)) throw new Error(`AES key must be 16, 24 or 32 bytes (got ${raw.length})`);
  return subtle.importKey('raw', raw, 'AES-CBC', false, ['encrypt', 'decrypt']);
}
export async function aesEncrypt(text, key, iv = crypto.getRandomValues(new Uint8Array(16))) {
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-CBC', iv }, await aesKey(key), enc.encode(text)));
  const all = new Uint8Array(16 + ct.length);
  all.set(iv);
  all.set(ct, 16);
  return toB64(all);
}
export async function aesDecrypt(b64, key) {
  const data = fromB64(b64);
  if (data.length < 32 || data.length % 16) throw new Error('Ciphertext has the wrong length');
  try {
    const pt = await subtle.decrypt({ name: 'AES-CBC', iv: data.slice(0, 16) }, await aesKey(key), data.slice(16));
    return dec.decode(pt);
  } catch {
    throw new Error('Decryption failed: wrong key or corrupted ciphertext');
  }
}

// ---- RSA-OAEP (SHA-1, MGF1-SHA-1), 2048-bit, PEM import/export ----
const RSA = { name: 'RSA-OAEP', hash: 'SHA-1' };
const pem = (label, buf) => `-----BEGIN ${label}-----\n${toB64(new Uint8Array(buf)).match(/.{1,64}/g).join('\n')}\n-----END ${label}-----`;
const unpem = (s) => fromB64(s.replace(/-----[^-]+-----/g, ''));

export async function rsaGenerate() {
  const kp = await subtle.generateKey({ ...RSA, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) }, true, ['encrypt', 'decrypt']);
  return { publicKey: kp.publicKey, privateKey: kp.privateKey };
}
export async function rsaExport({ publicKey, privateKey }) {
  return {
    publicPem: pem('PUBLIC KEY', await subtle.exportKey('spki', publicKey)),
    privatePem: privateKey ? pem('PRIVATE KEY', await subtle.exportKey('pkcs8', privateKey)) : null,
  };
}
// Accepts a PKCS#8 private key (enables encrypt + decrypt) or an SPKI public key (encrypt only).
export async function rsaImport(text) {
  if (/BEGIN PRIVATE KEY/.test(text)) {
    const privateKey = await subtle.importKey('pkcs8', unpem(text), RSA, true, ['decrypt']);
    const jwk = await subtle.exportKey('jwk', privateKey);
    const publicKey = await subtle.importKey('jwk', { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RSA-OAEP', ext: true }, RSA, true, ['encrypt']);
    return { publicKey, privateKey };
  }
  if (/BEGIN PUBLIC KEY/.test(text)) {
    return { publicKey: await subtle.importKey('spki', unpem(text), RSA, true, ['encrypt']), privateKey: null };
  }
  throw new Error('Paste a PEM key starting with -----BEGIN PRIVATE KEY----- or -----BEGIN PUBLIC KEY-----');
}
export async function rsaEncrypt(text, keys) {
  const bytes = enc.encode(text);
  if (bytes.length > 214) throw new Error(`Text too long for RSA (${bytes.length} bytes, max 214)`);
  return toB64(new Uint8Array(await subtle.encrypt(RSA, keys.publicKey, bytes)));
}
export async function rsaDecrypt(b64, keys) {
  if (!keys.privateKey) throw new Error('Decrypting needs the private key');
  try {
    return dec.decode(await subtle.decrypt(RSA, keys.privateKey, fromB64(b64)));
  } catch {
    throw new Error('Decryption failed: wrong key or corrupted ciphertext');
  }
}

// ---- Roman numerals ----
const ROMAN = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
export function toRoman(n) {
  if (!Number.isInteger(n) || n < 1 || n > 3999) throw new Error('Number must be between 1 and 3999');
  let r = '';
  for (const [v, s] of ROMAN) while (n >= v) { r += s; n -= v; }
  return r;
}
export function fromRoman(s) {
  const t = s.trim().toUpperCase();
  const vals = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  if (!/^[IVXLCDM]+$/.test(t)) throw new Error('Use only the letters I V X L C D M');
  let total = 0;
  for (let i = 0; i < t.length; i++) {
    const v = vals[t[i]];
    total += i + 1 < t.length && vals[t[i + 1]] > v ? -v : v;
  }
  if (total < 1 || total > 3999 || toRoman(total) !== t) throw new Error(`'${s.trim()}' is not a valid Roman numeral`);
  return total;
}
// Date (YYYY-MM-DD) -> "MMXXVI · X · I". The original concatenated with no separator; the dot keeps it readable and reversible.
export function dateToRoman(iso) {
  const m = /^(\d{1,4})-(\d{1,2})-(\d{1,2})$/.exec(iso.trim());
  if (!m) throw new Error('Enter a date as YYYY-MM-DD');
  const [y, mo, d] = m.slice(1).map(Number);
  const dt = new Date(0);
  dt.setUTCFullYear(y, mo - 1, d);
  if (y < 1 || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) throw new Error('That date does not exist');
  return [y, mo, d].map(toRoman).join(' · ');
}
