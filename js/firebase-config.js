import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// 請換成你的 Firebase 專案設定值（若未設定將自動使用瀏覽器 localStorage）
const firebaseConfig = {
  apiKey: "AIzaSyAfYVvUXbKJTlYOReLsFiDR2vl-gYnZUPc",
  authDomain: "daigou-6903e.firebaseapp.com",
  databaseURL: "https://daigou-6903e-default-rtdb.firebaseio.com",
  projectId: "daigou-6903e",
  storageBucket: "daigou-6903e.firebasestorage.app",
  messagingSenderId: "724803080074",
  appId: "1:724803080074:web:5ed012f80f27418ba1c273",
  measurementId: "G-ZG9MV53H7S"
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
