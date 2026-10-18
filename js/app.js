import { initStorage, subscribeState, exportToJsonFile, importFromJsonFile } from './storage.js';
import { initPersonalModule, renderPersonalList } from './personal.js';
import { initGroupModule, renderGroupList } from './group.js';
import { updateDashboard } from './dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
  initPersonalModule();
  initGroupModule();

  subscribeState(() => {
    renderPersonalList();
    renderGroupList();
    updateDashboard();
  });

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

      if (targetId === 'tab-dashboard') {
        updateDashboard();
      }
    });
  });

  document.getElementById('btn-export-json').addEventListener('click', exportToJsonFile);
  document.getElementById('file-import-json').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      importFromJsonFile(e.target.files[0]);
      e.target.value = '';
    }
  });

  initStorage();
});
