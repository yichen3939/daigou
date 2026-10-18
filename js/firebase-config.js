import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// 請換成你的 Firebase 專案設定值（若未設定將自動使用瀏覽器 localStorage）
const firebaseConfig = {
  apiKey: "AIzaSyAdJvL5njIHNka2dfUT9BxEuO-6HNwP4c4",
  authDomain: "myha-c220e.firebaseapp.com",
  projectId: "myha-c220e",
  storageBucket: "myha-c220e.firebasestorage.app",
  messagingSenderId: "928213571930",
  appId: "1:928213571930:web:3ef93a4ce4a6f74db4bb63",
  measurementId: "G-QW38XS7DB9"
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
