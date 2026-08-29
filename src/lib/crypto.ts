const PBKDF2_ITERATIONS = 250_000;

function bufToBase64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(b64: string) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
}

async function deriveKey(passphrase: string, salt: Uint8Array) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt.slice().buffer, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export type EncryptedEnvelope = {
  encrypted: true;
  salt: string;
  iv: string;
  ciphertext: string;
};

export async function encryptWithPassphrase(
  plaintext: string,
  passphrase: string,
): Promise<EncryptedEnvelope> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return {
    encrypted: true,
    salt: bufToBase64(salt.buffer),
    iv: bufToBase64(iv.buffer),
    ciphertext: bufToBase64(ciphertext),
  };
}

export async function decryptWithPassphrase(
  envelope: EncryptedEnvelope,
  passphrase: string,
): Promise<string> {
  const salt = new Uint8Array(base64ToBuf(envelope.salt));
  const iv = new Uint8Array(base64ToBuf(envelope.iv));
  const key = await deriveKey(passphrase, salt);
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      base64ToBuf(envelope.ciphertext),
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    throw new Error("Wrong passphrase or corrupted file");
  }
}

export function isEncryptedEnvelope(value: unknown): value is EncryptedEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { encrypted?: unknown }).encrypted === true &&
    typeof (value as { salt?: unknown }).salt === "string" &&
    typeof (value as { iv?: unknown }).iv === "string" &&
    typeof (value as { ciphertext?: unknown }).ciphertext === "string"
  );
}
