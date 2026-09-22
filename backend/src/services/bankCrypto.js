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
