import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// 請換成你的 Firebase 專案設定值（若未設定將自動使用瀏覽器 localStorage）
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

let db = null;
let isConfigured = false;

try {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    isConfigured = true;
  }
} catch (e) {
  console.warn("Firebase 初始化失敗或尚未配置，將使用本機 localStorage 運作。", e);
}

export { db, isConfigured, ref, set, onValue };
