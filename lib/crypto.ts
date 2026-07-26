function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64ToBuf(str: string): ArrayBuffer {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function importKey(base64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', base64ToBuf(base64), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']);
}

export async function generateKey(): Promise<string> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  return bufToBase64(await crypto.subtle.exportKey('raw', key));
}

export async function encrypt(text: string, keyBase64: string): Promise<string> {
  const key = await importKey(keyBase64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return bufToBase64(combined.buffer as ArrayBuffer);
}

export async function decrypt(combinedBase64: string, keyBase64: string): Promise<string> {
  const key = await importKey(keyBase64);
  const combined = base64ToBuf(combinedBase64);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}

async function deriveWrappingKey(password: string, saltB64: string): Promise<CryptoKey> {
  const pwKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: base64ToBuf(saltB64), iterations: 600000, hash: 'SHA-256' },
    pwKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey']
  );
}

export async function wrapE2EEKey(e2eeKeyB64: string, password: string): Promise<{ wrapped: string; salt: string; iv: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const wKey = await deriveWrappingKey(password, bufToBase64(salt.buffer as ArrayBuffer));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const e2eeKey = await importKey(e2eeKeyB64);
  const wrapped = await crypto.subtle.wrapKey('raw', e2eeKey, wKey, { name: 'AES-GCM', iv });
  return {
    wrapped: bufToBase64(wrapped),
    salt: bufToBase64(salt.buffer as ArrayBuffer),
    iv: bufToBase64(iv.buffer as ArrayBuffer),
  };
}

export async function unwrapE2EEKey(wrappedB64: string, password: string, saltB64: string, ivB64: string): Promise<string> {
  const wKey = await deriveWrappingKey(password, saltB64);
  const unwrapped = await crypto.subtle.unwrapKey(
    'raw', base64ToBuf(wrappedB64), wKey,
    { name: 'AES-GCM', iv: new Uint8Array(base64ToBuf(ivB64)) },
    { name: 'AES-GCM', length: 256 },
    true, ['decrypt']
  );
  return bufToBase64(await crypto.subtle.exportKey('raw', unwrapped));
}

