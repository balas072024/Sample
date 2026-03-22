const crypto = require("crypto");

function deriveKey(masterPassword, salt) {
  return crypto.scryptSync(masterPassword, salt, 32);
}

function encrypt(text, masterPassword, salt) {
  const key = deriveKey(masterPassword, salt);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

function decrypt(encryptedStr, masterPassword, salt) {
  const [ivHex, tagHex, data] = encryptedStr.split(":");
  const key = deriveKey(masterPassword, salt);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  let decrypted = decipher.update(data, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function hashMaster(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function generatePassword(length = 20, options = {}) {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  let chars = lower + upper + digits;
  if (options.symbols !== false) chars += symbols;
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes).map(b => chars[b % chars.length]).join("");
}

module.exports = { encrypt, decrypt, hashMaster, generatePassword };
