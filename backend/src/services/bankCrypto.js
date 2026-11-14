import crypto from "crypto";

const KEY_ENV_NAME = "BANK_DETAILS_ENCRYPTION_KEY";
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

const encryptionKey = () => {
  const encoded = process.env[KEY_ENV_NAME];
  if (!encoded || !BASE64_PATTERN.test(encoded)) {
    throw new Error(`${KEY_ENV_NAME} must be a base64-encoded 32-byte key.`);
  }

  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error(`${KEY_ENV_NAME} must decode to exactly 32 bytes.`);
  return key;
};

// Resolve configuration at startup so an unsafe deployment cannot accept bank details.
const key = encryptionKey();

export const encryptBankAccountNumber = (accountNumber) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(accountNumber, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${ciphertext.toString("base64url")}.${tag.toString("base64url")}`;
};

export const decryptBankAccountNumber = (formattedCiphertext) => {
  if (typeof formattedCiphertext !== "string" || !formattedCiphertext) {
    throw new Error("Invalid ciphertext string.");
  }
  const parts = formattedCiphertext.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Unsupported or corrupted ciphertext version format.");
  }

  const iv = Buffer.from(parts[1], "base64url");
  const ciphertext = Buffer.from(parts[2], "base64url");
  const tag = Buffer.from(parts[3], "base64url");

  if (iv.length !== 12) throw new Error("Invalid IV length for AES-256-GCM.");
  if (tag.length !== 16) throw new Error("Invalid auth tag length for AES-256-GCM.");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
};
