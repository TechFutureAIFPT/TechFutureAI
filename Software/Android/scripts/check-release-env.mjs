import fs from "node:fs";
import path from "node:path";

const envFiles = [".env", ".env.local", ".env.production"];
const required = [
  "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID",
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
];
const recommended = ["EXPO_PUBLIC_API_URL", "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"];
const fileValues = new Map();

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const index = trimmed.indexOf("=");
  if (index < 1) return null;
  const key = trimmed.slice(0, index).trim();
  let value = trimmed.slice(index + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return [key, value];
}

for (const file of envFiles) {
  const fullPath = path.resolve(file);
  if (!fs.existsSync(fullPath)) continue;
  const content = fs.readFileSync(fullPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (parsed) fileValues.set(parsed[0], parsed[1]);
  }
}

function valueFor(key) {
  return (process.env[key] || fileValues.get(key) || "").trim();
}

const missing = required.filter((key) => !valueFor(key));
const missingRecommended = recommended.filter((key) => !valueFor(key));

if (missing.length > 0) {
  console.error(`Missing release env: ${missing.join(", ")}`);
  console.error("Android release requires Supabase credentials and the Google OAuth client ID for com.supporthr.companion.");
  process.exit(1);
}

if (missingRecommended.length > 0) {
  console.warn(`Recommended env not set: ${missingRecommended.join(", ")}`);
}

console.log("Release env OK");
