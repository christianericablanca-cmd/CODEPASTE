import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';

function getOwnerKeySecret(): Buffer {
  const secret = process.env.OWNER_KEY_PEPPER;
  if (!secret) throw new Error('OWNER_KEY_PEPPER not set in environment');
  return createHash('sha256').update(secret).digest();
}

export function serverEncryptKey(plaintextKey: string): string {
  const key = getOwnerKeySecret();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintextKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return iv.toString('hex') + ':' + authTag + ':' + encrypted;
}

export function serverDecryptKey(encrypted: string): string {
  const key = getOwnerKeySecret();
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
