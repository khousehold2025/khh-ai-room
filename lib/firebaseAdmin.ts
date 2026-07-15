import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

function getFirebaseApp() {
  const apps = getApps();

  if (apps.length > 0) {
    return apps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  const localKeyPath = path.join(
    process.cwd(),
    "firebase",
    "firebase-admin.json"
  );

  if (!fs.existsSync(localKeyPath)) {
    throw new Error("Firebase Admin 키를 찾을 수 없습니다.");
  }

  const serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, "utf-8"));

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

const app = getFirebaseApp();

export const db = getFirestore(app);
export { FieldValue };