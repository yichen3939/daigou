import { initStorage, subscribeState, exportToJsonFile, importFromJsonFile } from './storage.js';
import { initPersonalModule, renderPersonalList } from './personal.js';
import { initGroupModule, renderGroupList } from './group.js';
import { initSaleModule, renderSaleList } from './sale.js';
import { initBuyerModule, renderBuyerList } from './buyer.js';
import { updateDashboard } from './dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. 最優先綁定導覽列切換，確保點擊 100% 有效，絕不卡死
  const tabs = document.querySelectorAll('.nav-tab');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.target;

      tabs.forEach(t => {
        t.classList.remove('active-tab');
        t.classList.add('inactive-tab');
      });
      tab.classList.remove('inactive-tab');
      tab.classList.add('active-tab');

      panes.forEach(pane => {
        if (pane.id === targetId) {
          pane.classList.remove('hidden');
        } else {
          pane.classList.add('hidden');
        }
      });

      if (targetId === 'tab-sale') {
        try { renderSaleList(); } catch (e) { console.error(e); }
      }
      if (targetId === 'tab-buyer') {
        try { renderBuyerList(); } catch (e) { console.error(e); }
      }
      if (targetId === 'tab-dashboard') {
        try { updateDashboard(); } catch (e) { console.error(e); }
      }
    });
  });

  // 2. 獨立以 try-catch 初始化各模組
  try { initPersonalModule(); } catch (e) { console.error("個人自購模組:", e); }
  try { initGroupModule(); } catch (e) { console.error("揪團模組:", e); }
  try { initSaleModule(); } catch (e) { console.error("出物模組:", e); }
  try { initBuyerModule(); } catch (e) { console.error("買家模組:", e); }

  // 3. 狀態變更時重新渲染
  subscribeState(() => {
    try { renderPersonalList(); } catch (e) { console.error(e); }
    try { renderGroupList(); } catch (e) { console.error(e); }
    try { renderSaleList(); } catch (e) { console.error(e); }
    try { renderBuyerList(); } catch (e) { console.error(e); }
    try { updateDashboard(); } catch (e) { console.error(e); }
  });

  // 4. 備份與匯入按鈕
  document.getElementById('btn-export-json')?.addEventListener('click', exportToJsonFile);
  document.getElementById('file-import-json')?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      importFromJsonFile(e.target.files[0]);
      e.target.value = '';
    }
  });

  // 5. 初始化雲端與本機儲存
  try { initStorage(); } catch (e) { console.error("Storage 初始化:", e); }
});
