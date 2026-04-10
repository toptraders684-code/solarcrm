import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-cbc';

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY not set');
  return Buffer.from(key, 'hex');
}

function getIv(): Buffer {
  const iv = process.env.ENCRYPTION_IV;
  if (!iv) throw new Error('ENCRYPTION_IV not set');
  return Buffer.from(iv, 'hex');
}

export function encrypt(text: string): string {
  const cipher = createCipheriv(ALGORITHM, getKey(), getIv());
  return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
}

export function decrypt(encrypted: string): string {
  const decipher = createDecipheriv(ALGORITHM, getKey(), getIv());
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}

export function generateToken(): string {
  return randomBytes(16).toString('hex');
}
