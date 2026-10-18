import { db, isConfigured, ref, set, onValue } from './firebase-config.js';

const STORAGE_KEY = 'merch_tracker_app_data';

export const appState = {
  personalPurchases: [],
  groupOrders: [],
  personalSales: []
};

// 訂閱資料更新的回呼函式清單
const listeners = [];
export function subscribeState(cb) {
  listeners.push(cb);
}

function notifyAll() {
  listeners.forEach(cb => {
    try { cb(appState); } catch (e) { console.error(e); }
  });
}

// 初始化監聽：優先使用 Firebase，次之 localStorage
export function initStorage() {
  if (isConfigured && db) {
    const rootRef = ref(db, 'merchTracker');
    onValue(rootRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        appState.personalPurchases = data.personalPurchases || [];
        appState.groupOrders = data.groupOrders || [];
        appState.personalSales = data.personalSales || [];
      } else {
        loadFromLocalStorage();
      }
      notifyAll();
    });
  } else {
    loadFromLocalStorage();
    notifyAll();
  }
}

function loadFromLocalStorage() {
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      appState.personalPurchases = parsed.personalPurchases || [];
      appState.groupOrders = parsed.groupOrders || [];
      appState.personalSales = parsed.personalSales || [];
    } catch (e) {
      console.error("Local data parse error", e);
    }
  }
}

// 儲存資料（同時同步到雲端與 localStorage）
export async function persistData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  if (isConfigured && db) {
    try {
      const rootRef = ref(db, 'merchTracker');
      await set(rootRef, appState);
    } catch (e) {
      console.error("Firebase 寫入失敗", e);
    }
  }
  notifyAll();
}

// 匯出 JSON
export function exportToJsonFile() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `merch_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// 匯入 JSON
export function importFromJsonFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported.personalPurchases || imported.groupOrders || imported.personalSales) {
        appState.personalPurchases = imported.personalPurchases || [];
        appState.groupOrders = imported.groupOrders || [];
        appState.personalSales = imported.personalSales || [];
        persistData();
        alert('匯入備份成功！');
      } else {
        alert('JSON 格式不符！');
      }
    } catch (err) {
      alert('無法解析檔案，請確認為正確的 JSON 備份檔。');
    }
  };
  reader.readAsText(file);
}
