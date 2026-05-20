#!/usr/bin/env node
/**
 * Firestore `recipes` koleksiyonunda imageUrl alanı eksik, null veya boş olan
 * belgeleri listeler; onay sonrası siler.
 *
 * Kimlik doğrulama (sırayla denenir):
 *   1. GOOGLE_APPLICATION_CREDENTIALS veya serviceAccountKey.json (Admin SDK)
 *   2. firebase login oturumu (~/.config/configstore/firebase-tools.json)
 *
 * Kullanım:
 *   node scripts/delete-recipes-without-imageUrl.js
 *   node scripts/delete-recipes-without-imageUrl.js --dry-run
 *   node scripts/delete-recipes-without-imageUrl.js --yes
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const os = require("os");

const PROJECT_ID = "health-guide-app-a0701";
const COLLECTION = "recipes";
const FIREBASE_CLI_CLIENT_ID =
  "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const FIREBASE_CLI_CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const autoConfirm = args.includes("--yes");

function resolveServiceAccountPath() {
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    path.join(__dirname, "..", "serviceAccountKey.json"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }
  return null;
}

function readFirebaseCliTokens() {
  const configPath = path.join(
    os.homedir(),
    ".config/configstore/firebase-tools.json"
  );
  if (!fs.existsSync(configPath)) {
    return null;
  }
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return config.tokens ?? null;
  } catch {
    return null;
  }
}

async function refreshFirebaseCliAccessToken(tokens) {
  if (!tokens?.refresh_token) {
    throw new Error("Firebase CLI refresh token bulunamadı. `firebase login` çalıştırın.");
  }

  const body = new URLSearchParams({
    client_id: FIREBASE_CLI_CLIENT_ID,
    client_secret: FIREBASE_CLI_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: tokens.refresh_token,
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Firebase CLI token yenilenemedi (${response.status}). ` +
        "`firebase login --reauth` deneyin.\n" +
        text
    );
  }

  const data = await response.json();
  return data.access_token;
}

async function getAccessToken() {
  if (process.env.FIREBASE_ACCESS_TOKEN?.trim()) {
    return process.env.FIREBASE_ACCESS_TOKEN.trim();
  }

  const tokens = readFirebaseCliTokens();
  if (!tokens) {
    throw new Error("Firebase CLI oturumu bulunamadı.");
  }

  const stillValid =
    tokens.access_token &&
    typeof tokens.expires_at === "number" &&
    Date.now() < tokens.expires_at - 60_000;

  if (stillValid) {
    return tokens.access_token;
  }

  return refreshFirebaseCliAccessToken(tokens);
}

function decodeFirestoreValue(value) {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  if ("stringValue" in value) return value.stringValue;
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  return value;
}

function decodeFirestoreDocument(doc) {
  const data = {};
  const fields = doc.fields ?? {};
  for (const [key, value] of Object.entries(fields)) {
    data[key] = decodeFirestoreValue(value);
  }
  return {
    id: doc.name.split("/").pop(),
    data,
  };
}

async function listRecipesViaRest(accessToken) {
  const documents = [];
  let pageToken = "";

  do {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}`
    );
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Firestore list hatası (${response.status}): ${text}`);
    }

    const payload = await response.json();
    for (const doc of payload.documents ?? []) {
      documents.push(decodeFirestoreDocument(doc));
    }
    pageToken = payload.nextPageToken ?? "";
  } while (pageToken);

  return documents;
}

async function deleteRecipeViaRest(accessToken, docId) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/${docId}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Silme hatası [${docId}] (${response.status}): ${text}`);
  }
}

async function listRecipesViaAdmin() {
  const admin = require("firebase-admin");
  if (admin.apps.length === 0) {
    const keyPath = resolveServiceAccountPath();
    if (!keyPath) {
      throw new Error("Service account dosyası bulunamadı.");
    }
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: PROJECT_ID,
    });
    console.log(`Kimlik: service account (${path.basename(keyPath)})\n`);
  }

  const snapshot = await admin.firestore().collection(COLLECTION).get();
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    data: docSnap.data(),
  }));
}

async function deleteRecipesViaAdmin(docIds) {
  const admin = require("firebase-admin");
  const db = admin.firestore();
  const batchSize = 400;

  for (let i = 0; i < docIds.length; i += batchSize) {
    const batch = db.batch();
    const chunk = docIds.slice(i, i + batchSize);
    chunk.forEach((id) => {
      batch.delete(db.collection(COLLECTION).doc(id));
    });
    await batch.commit();
  }
}

function hasValidImageUrl(data) {
  if (!Object.prototype.hasOwnProperty.call(data, "imageUrl")) {
    return false;
  }
  const value = data.imageUrl;
  if (value == null) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return Boolean(value);
}

function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function resolveAuthMode() {
  if (resolveServiceAccountPath()) {
    return "admin";
  }
  try {
    await getAccessToken();
    return "rest";
  } catch {
    return null;
  }
}

async function main() {
  const authMode = await resolveAuthMode();
  if (!authMode) {
    console.error(
      "Kimlik doğrulama bulunamadı.\n\n" +
        "Seçenekler:\n" +
        "  1. Terminalde: firebase login\n" +
        "  2. Firebase Console → Service accounts → private key indir\n" +
        `     → ${path.join(__dirname, "..", "serviceAccountKey.json")} olarak kaydet\n`
    );
    process.exit(1);
  }

  console.log(`Proje: ${PROJECT_ID}`);
  console.log(`Koleksiyon: ${COLLECTION}`);
  console.log(`Kimlik: ${authMode === "admin" ? "Admin SDK" : "Firebase CLI OAuth"}`);
  console.log('Filtre: imageUrl eksik, null veya boş string\n');

  let recipes;
  let accessToken;

  if (authMode === "admin") {
    recipes = await listRecipesViaAdmin();
  } else {
    accessToken = await getAccessToken();
    console.log("Kimlik: firebase login oturumu\n");
    recipes = await listRecipesViaRest(accessToken);
  }

  const toDelete = recipes
    .filter(({ data }) => !hasValidImageUrl(data))
    .map(({ id, data }) => ({
      id,
      title: String(data.title ?? "(başlıksız)"),
      imageUrl: Object.prototype.hasOwnProperty.call(data, "imageUrl")
        ? data.imageUrl
        : "(alan yok)",
      author: String(data.author ?? ""),
    }));

  if (toDelete.length === 0) {
    console.log("Silinecek belge bulunamadı.");
    return;
  }

  console.log(`Etkilenecek belge sayısı: ${toDelete.length}\n`);
  console.log("Başlıklar:");
  toDelete.forEach((item, index) => {
    console.log(
      `  ${index + 1}. [${item.id}] ${item.title}` +
        ` (imageUrl: ${JSON.stringify(item.imageUrl)})` +
        (item.author ? ` — ${item.author}` : "")
    );
  });
  console.log("");

  if (dryRun) {
    console.log("--dry-run: Silme işlemi yapılmadı.");
    return;
  }

  let confirmed = autoConfirm;
  if (!confirmed) {
    const answer = await askConfirmation(
      `${toDelete.length} belge silinsin mi? (evet/hayır): `
    );
    confirmed =
      answer === "evet" ||
      answer === "e" ||
      answer === "yes" ||
      answer === "y";
  }

  if (!confirmed) {
    console.log("İşlem iptal edildi. Hiçbir belge silinmedi.");
    return;
  }

  const ids = toDelete.map((item) => item.id);

  if (authMode === "admin") {
    await deleteRecipesViaAdmin(ids);
    console.log(`\nTamamlandı. ${ids.length} belge silindi.`);
    return;
  }

  let deleted = 0;
  for (const id of ids) {
    await deleteRecipeViaRest(accessToken, id);
    deleted += 1;
    console.log(`Silindi: ${deleted}/${ids.length} — ${id}`);
  }

  console.log(`\nTamamlandı. ${deleted} belge silindi.`);
}

main().catch((error) => {
  console.error("\nHata:", error.message || error);
  process.exit(1);
});
