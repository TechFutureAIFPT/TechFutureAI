/**
 * Vercel runtime configuration endpoint.
 *
 * Only public Firebase Web configuration and the public API origin belong here.
 * Do not add Firebase Admin, OAuth client secrets, Gemini keys, or other backend
 * secrets: this response is deliberately delivered to every browser.
 */
module.exports = (request, response) => {
  const firebase = {};
  if (process.env.FIREBASE_WEB_API_KEY) firebase.apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (process.env.FIREBASE_AUTH_DOMAIN) firebase.authDomain = process.env.FIREBASE_AUTH_DOMAIN;
  if (process.env.FIREBASE_PROJECT_ID) firebase.projectId = process.env.FIREBASE_PROJECT_ID;
  if (process.env.FIREBASE_APP_ID) firebase.appId = process.env.FIREBASE_APP_ID;
  if (process.env.FIREBASE_STORAGE_BUCKET) firebase.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (process.env.FIREBASE_MESSAGING_SENDER_ID) firebase.messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID;
  if (process.env.FIREBASE_MEASUREMENT_ID) firebase.measurementId = process.env.FIREBASE_MEASUREMENT_ID;

  const runtime = {};
  if (process.env.API_BASE_URL) runtime.API_BASE_URL = process.env.API_BASE_URL;
  if (process.env.API_FALLBACK_URL) runtime.API_FALLBACK_URL = process.env.API_FALLBACK_URL;
  if (Object.keys(firebase).length > 0) runtime.FIREBASE = firebase;
  if (process.env.REQUEST_TIMEOUT_MS) runtime.REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS);
  if (process.env.ANALYSIS_POLL_TIMEOUT_MS) runtime.ANALYSIS_POLL_TIMEOUT_MS = Number(process.env.ANALYSIS_POLL_TIMEOUT_MS);
  if (process.env.DEMO_MODE) runtime.DEMO_MODE = process.env.DEMO_MODE === "true";
  if (process.env.DEBUG) runtime.DEBUG = process.env.DEBUG === "true";

  const source = `(() => {
    const existing = window.SUPPORT_HR_CONFIG || {};
    const runtime = ${JSON.stringify(runtime)};
    window.SUPPORT_HR_CONFIG = Object.freeze({
      ...existing,
      ...runtime,
      FIREBASE: Object.freeze({ ...(existing.FIREBASE || {}), ...(runtime.FIREBASE || {}) }),
    });
  })();`;

  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("Content-Type", "application/javascript; charset=utf-8");
  response.status(200).send(source);
};
