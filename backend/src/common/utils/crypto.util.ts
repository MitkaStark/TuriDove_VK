import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

/**
 * AES-256-GCM helper para cifrar/descifrar secretos almacenados en BD.
 *
 * Formato del ciphertext:  base64(iv || authTag || encrypted)
 *  - iv:        12 bytes
 *  - authTag:   16 bytes
 *  - encrypted: variable
 *
 * La key (32 bytes) se deriva con scrypt del env CONFIG_ENCRYPTION_KEY.
 * Si esa env var falta, encrypt/decrypt lanzan error con mensaje claro.
 */

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_SALT = 'turidove-stripe-config-v1';

function getKey(): Buffer {
  const envKey = process.env.CONFIG_ENCRYPTION_KEY;
  if (!envKey || envKey.length < 32) {
    throw new Error(
      'CONFIG_ENCRYPTION_KEY no configurada o demasiado corta (>=32 hex chars). ' +
        'Genera una con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  // scrypt derive: el usuario puede usar cualquier longitud razonable; producimos 32 bytes.
  return scryptSync(envKey, KEY_SALT, 32);
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) return '';
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptSecret(ciphertext: string): string {
  if (!ciphertext) return '';
  const key = getKey();
  const buf = Buffer.from(ciphertext, 'base64');
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new Error('Ciphertext inválido: demasiado corto');
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const encrypted = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return dec.toString('utf8');
}

/** Devuelve solo los últimos 4 caracteres de un secreto + prefijo público (sk_test_). */
export function maskKey(value: string): string | null {
  if (!value || value.length < 12) return null;
  const parts = value.split('_');
  const prefix = parts.length >= 2 ? `${parts[0]}_${parts[1]}_` : value.slice(0, 6);
  return `${prefix}...${value.slice(-4)}`;
}
