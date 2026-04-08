import CryptoJS from 'crypto-js';

// Secret fragments XOR'd to avoid plain string literal in source.
// Derived at runtime — any edit to these bytes changes the secret.
const _RAW = [0x60, 0x43, 0x41, 0x48, 0x76, 0x5b, 0x48, 0x4a, 0x1c, 0x1e, 0x1c, 0x1a, 0x6d, 0x55, 0x47, 0x42];
const _XK = 0x3e;
const _SECRET = _RAW.map((b) => String.fromCharCode(b ^ _XK)).join('');

const VERSION = 'v1';

function sign(json) {
  return CryptoJS.HmacSHA256(json, _SECRET).toString();
}

export function encodePayload(payload) {
  const json = JSON.stringify(payload);
  return `${VERSION}.${btoa(json)}.${sign(json)}`;
}

export function decodePayload(raw) {
  if (!raw || raw.charAt(0) === '{') return null; // plain JSON → migration path
  const parts = raw.split('.');
  if (parts.length !== 3 || parts[0] !== VERSION) return null;
  let json;
  try {
    json = atob(parts[1]);
  } catch {
    return null;
  }
  if (sign(json) !== parts[2]) return null; // assinatura inválida → tampered
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Exposto apenas para testes
export { sign as _sign };
