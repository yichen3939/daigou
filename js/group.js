import { appState, persistData } from './storage.js';

export function initGroupModule() {
  const container = document.getElementById('group-items-container');
  const searchInput = document.getElementById('group-search');
  const modalGroup = document.getElementById('modal-group');
  const modalGroupTitle = document.getElementById('modal-group-title');
  const groupEditIdInput = document.getElementById('group-edit-id');
  const modalSubitem = document.getElementById('modal-subitem');
  const modalSubitemTitle = document.getElementById('modal-subitem-title');
  const subitemEditIdInput = document.getElementById('subitem-edit-id');
  const formGroup = document.getElementById('form-group');
  const formSubitem = document.getElementById('form-subitem');

  // 開啟主團 Modal (新增)
  document.getElementById('btn-open-group-modal').addEventListener('click', () => {
    formGroup.reset();
    groupEditIdInput.value = '';
    modalGroupTitle.textContent = '發起新揪團主檔';
    modalGroup.classList.remove('hidden');
  });

  // 取消主團 Modal
  document.getElementById('btn-cancel-group').addEventListener('click', () => {
    formGroup.reset();
    groupEditIdInput.value = '';
    modalGroup.classList.add('hidden');
  });

  // 主團表單提交 (新增或編輯)
  formGroup.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(formGroup);
    const editId = groupEditIdInput.value;

    if (editId) {
      const target = appState.groupOrders.find(g => g.id === editId);
      if (target) {
        target.name = fd.get('name');
        target.imageUrl = fd.get('imageUrl') || '';
        target.category = fd.get('category') || '徽章拆團';
        target.orderDate = fd.get('orderDate') || '';
        target.costJpy = Number(fd.get('costJpy')) || 0;
        target.costTwd = Number(fd.get('costTwd')) || 0;
        target.targetPrice = Number(fd.get('targetPrice')) || 0;
        target.notes = fd.get('notes') || '';
      }
    } else {
      const newGroup = {
        id: 'g_' + Date.now(),
        name: fd.get('name'),
        imageUrl: fd.get('imageUrl') || '',
        category: fd.get('category') || '徽章拆團',
        orderDate: fd.get('orderDate') || '',
        costJpy: Number(fd.get('costJpy')) || 0,
        costTwd: Number(fd.get('costTwd')) || 0,
        targetPrice: Number(fd.get('targetPrice')) || 0,
        notes: fd.get('notes') || '',
        isExpanded: true,
        items: []
      };
      appState.groupOrders.unshift(newGroup);
    }

    persistData();
    formGroup.reset();
    groupEditIdInput.value = '';
    modalGroup.classList.add('hidden');
  });

  // 子項目 Modal 取消
  document.getElementById('btn-cancel-subitem').addEventListener('click', () => {
    formSubitem.reset();
    subitemEditIdInput.value = '';
    modalSubitem.classList.add('hidden');
  });

  // 提交子項目 (新增或編輯)
  formSubitem.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(formSubitem);
    const groupId = document.getElementById('subitem-group-id').value;
    const subitemId = subitemEditIdInput.value;
    const targetGroup = appState.groupOrders.find(g => g.id === groupId);

    if (targetGroup) {
      if (subitemId) {
        const item = targetGroup.items.find(i => i.id === subitemId);
        if (item) {
          item.characterName = fd.get('characterName');
          item.buyer = fd.get('buyer') || '未認領';
          item.price = Number(fd.get('price')) || 0;
          item.buyerNote = fd.get('buyerNote') || '';
        }
      } else {
        targetGroup.items.push({
          id: 'c_' + Date.now(),
          characterName: fd.get('characterName'),
          buyer: fd.get('buyer') || '未認領',
          price: Number(fd.get('price')) || 0,
          firstPaid: false,
          secondPayAmount: 0,
          secondPayStatus: '未通知',
          buyerNote: fd.get('buyerNote') || ''
        });
      }
      persistData();
    }
    formSubitem.reset();
    subitemEditIdInput.value = '';
    modalSubitem.classList.add('hidden');
  });

  searchInput.addEventListener('input', () => renderGroupList());
}

export function renderGroupList() {
  const container = document.getElementById('group-items-container');
  const query = document.getElementById('group-search').value.trim().toLowerCase();

  const filtered = appState.groupOrders.filter(group => {
    const groupNameMatch = group.name.toLowerCase().includes(query);
    const subItemMatch = group.items.some(item => 
      item.characterName.toLowerCase().includes(query) || 
      item.buyer.toLowerCase().includes(query)
    );
    return groupNameMatch || subItemMatch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="text-center py-12 text-slate-400 text-sm">暫無揪團拆團紀錄</div>`;
    return;
  }

  container.innerHTML = filtered.map(group => {
    const totalSplitPrice = group.items.reduce((sum, item) => sum + item.price, 0);
    const profit = totalSplitPrice - group.costTwd;
    const firstPaidAmount = group.items.filter(i => i.firstPaid).reduce((sum, item) => sum + item.price, 0);
    const firstUnpaidAmount = totalSplitPrice - firstPaidAmount;

    return `
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm" data-id="${group.id}">
        <div class="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 bg-slate-50/50">
          <div class="flex items-center space-x-3">
            <button class="btn-toggle-expand text-slate-400 hover:text-slate-600 transition" data-id="${group.id}">
              ${group.isExpanded ? '▼' : '▶'}
            </button>
            <div>
              <div class="flex items-center gap-2">
                <span class="badge bg-indigo-100 text-indigo-700">${group.category}</span>
                <h3 class="font-bold text-slate-900 text-base">${group.name}</h3>
              </div>
              <div class="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4">
                <span>下單日：${group.orderDate || '--'}</span>
                <span>原幣總計：¥ ${group.costJpy.toLocaleString()}</span>
                <span>台幣成本：NT$ ${group.costTwd.toLocaleString()}</span>
                ${group.notes ? `<span>備註：${group.notes}</span>` : ''}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div class="text-right">
              <div class="text-xs text-slate-500">拆團總額 / 利潤差額</div>
              <div class="text-sm font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-500'}">
                NT$ ${totalSplitPrice.toLocaleString()} 
                <span class="text-xs">(${profit >= 0 ? '+' : ''}${profit.toLocaleString()})</span>
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              <button data-id="${group.id}" class="btn-add-subitem px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition">+ 認領項目</button>
              <button data-id="${group.id}" class="btn-edit-group text-slate-400 hover:text-indigo-600 px-2 py-1 text-sm" title="編輯揪團主檔">✏️</button>
              <button data-id="${group.id}" class="btn-delete-group text-slate-300 hover:text-rose-500 px-2 py-1 text-sm" title="刪除揪團">✕</button>
            </div>
          </div>
        </div>

        <div class="${group.isExpanded ? '' : 'hidden'} p-5">
          <div class="flex justify-between items-center text-xs text-slate-500 pb-3 border-b mb-3">
            <span>一補已收：<strong class="text-slate-800">NT$ ${firstPaidAmount.toLocaleString()}</strong> / 待收：<strong class="text-rose-500">NT$ ${firstUnpaidAmount.toLocaleString()}</strong></span>
            <span>共認領 ${group.items.length} 項目</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-slate-400 font-medium border-b">
                <tr>
                  <th class="pb-2">角色 / 款式</th>
                  <th class="pb-2">認領買家</th>
                  <th class="pb-2">拆團售價</th>
                  <th class="pb-2">一補本體</th>
                  <th class="pb-2">二補金額</th>
                  <th class="pb-2">二補收款狀態</th>
                  <th class="pb-2">備註說明</th>
                  <th class="pb-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${group.items.length === 0 ? `
                  <tr><td colspan="8" class="text-center py-4 text-slate-400">目前尚無角色認領明細</td></tr>
                ` : group.items.map(item => `
                  <tr class="hover:bg-slate-50/50">
                    <td class="py-2.5 font-bold text-slate-800">${item.characterName}</td>
                    <td class="py-2.5 font-medium text-slate-600">${item.buyer}</td>
                    <td class="py-2.5 font-semibold text-slate-900">NT$ ${item.price}</td>
                    <td class="py-2.5">
                      <button data-gid="${group.id}" data-cid="${item.id}" class="btn-toggle-firstpay badge cursor-pointer transition ${item.firstPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}">
                        ${item.firstPaid ? '✓ 已匯款' : '✕ 未付款'}
                      </button>
                    </td>
                    <td class="py-2.5">
                      <input type="number" min="0" value="${item.secondPayAmount}" data-gid="${group.id}" data-cid="${item.id}" class="input-second-amount w-16 px-1.5 py-0.5 border rounded text-xs">
                    </td>
                    <td class="py-2.5">
                      <button data-gid="${group.id}" data-cid="${item.id}" class="btn-cycle-secondpay badge cursor-pointer transition ${getSecondPayClass(item.secondPayStatus)}">
                        ${item.secondPayStatus}
                      </button>
                    </td>
                    <td class="py-2.5 text-slate-400 truncate max-w-[120px]">${item.buyerNote || '--'}</td>
                    <td class="py-2.5 text-right space-x-1">
                      <button data-gid="${group.id}" data-cid="${item.id}" class="btn-edit-subitem text-slate-400 hover:text-indigo-600 p-1" title="修改角色">✏️</button>
                      <button data-gid="${group.id}" data-cid="${item.id}" class="btn-delete-subitem text-slate-300 hover:text-rose-500 p-1" title="刪除角色">✕</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }).join('');

  attachGroupEvents();
}

function attachGroupEvents() {
  const container = document.getElementById('group-items-container');

  // 折疊切換
  container.querySelectorAll('.btn-toggle-expand').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = appState.groupOrders.find(item => item.id === btn.dataset.id);
      if (g) {
        g.isExpanded = !g.isExpanded;
        persistData();
      }
    });
  });

  // 編輯主團
  container.querySelectorAll('.btn-edit-group').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = appState.groupOrders.find(g => g.id === btn.dataset.id);
      if (group) {
        const formGroup = document.getElementById('form-group');
        const modalGroup = document.getElementById('modal-group');
        const modalGroupTitle = document.getElementById('modal-group-title');
        const groupEditIdInput = document.getElementById('group-edit-id');

        modalGroupTitle.textContent = '修改揪團主檔';
        groupEditIdInput.value = group.id;
        formGroup.elements['name'].value = group.name;
        formGroup.elements['imageUrl'].value = group.imageUrl || '';
        formGroup.elements['category'].value = group.category;
        formGroup.elements['orderDate'].value = group.orderDate || '';
        formGroup.elements['costJpy'].value = group.costJpy || 0;
        formGroup.elements['costTwd'].value = group.costTwd || 0;
        formGroup.elements['targetPrice'].value = group.targetPrice || 0;
        formGroup.elements['notes'].value = group.notes || '';

        modalGroup.classList.remove('hidden');
      }
    });
  });

  // 刪除主團
  container.querySelectorAll('.btn-delete-group').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('確定刪除此揪團主檔與所有角色認領明細嗎？')) {
        appState.groupOrders = appState.groupOrders.filter(g => g.id !== btn.dataset.id);
        persistData();
      }
    });
  });

  // 開啟認領角色 Modal (新增)
  container.querySelectorAll('.btn-add-subitem').forEach(btn => {
    btn.addEventListener('click', () => {
      const formSubitem = document.getElementById('form-subitem');
      formSubitem.reset();
      document.getElementById('subitem-group-id').value = btn.dataset.id;
      document.getElementById('subitem-edit-id').value = '';
      document.getElementById('modal-subitem-title').textContent = '新增認領角色';
      document.getElementById('modal-subitem').classList.remove('hidden');
    });
  });

  // 編輯認領角色
  container.querySelectorAll('.btn-edit-subitem').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = appState.groupOrders.find(g => g.id === btn.dataset.gid);
      const item = group?.items.find(i => i.id === btn.dataset.cid);
      if (group && item) {
        const formSubitem = document.getElementById('form-subitem');
        document.getElementById('subitem-group-id').value = group.id;
        document.getElementById('subitem-edit-id').value = item.id;
        document.getElementById('modal-subitem-title').textContent = '修改認領角色';

        formSubitem.elements['characterName'].value = item.characterName;
        formSubitem.elements['buyer'].value = item.buyer === '未認領' ? '' : item.buyer;
        formSubitem.elements['price'].value = item.price;
        formSubitem.elements['buyerNote'].value = item.buyerNote || '';

        document.getElementById('modal-subitem').classList.remove('hidden');
      }
    });
  });

  // 刪除角色
  container.querySelectorAll('.btn-delete-subitem').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = appState.groupOrders.find(g => g.id === btn.dataset.gid);
      if (group) {
        group.items = group.items.filter(i => i.id !== btn.dataset.cid);
        persistData();
      }
    });
  });

  // 一補狀態快速切換
  container.querySelectorAll('.btn-toggle-firstpay').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = appState.groupOrders.find(g => g.id === btn.dataset.gid);
      const item = group?.items.find(i => i.id === btn.dataset.cid);
      if (item) {
        item.firstPaid = !item.firstPaid;
        persistData();
      }
    });
  });

  // 二補金額修改
  container.querySelectorAll('.input-second-amount').forEach(input => {
    input.addEventListener('change', (e) => {
      const group = appState.groupOrders.find(g => g.id === input.dataset.gid);
      const item = group?.items.find(i => i.id === input.dataset.cid);
      if (item) {
        item.secondPayAmount = Number(e.target.value) || 0;
        persistData();
      }
    });
  });

  // 二補狀態循環切換
  container.querySelectorAll('.btn-cycle-secondpay').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = appState.groupOrders.find(g => g.id === btn.dataset.gid);
      const item = group?.items.find(i => i.id === btn.dataset.cid);
      if (item) {
        const flow = ['未通知', '已通知待付', '已結清'];
        const currentIdx = flow.indexOf(item.secondPayStatus);
        item.secondPayStatus = flow[(currentIdx + 1) % flow.length];
        persistData();
      }
    });
  });
}

function getSecondPayClass(status) {
  switch (status) {
    case '未通知': return 'bg-slate-100 text-slate-600';
    case '已通知待付': return 'bg-amber-100 text-amber-800';
    case '已結清': return 'bg-emerald-100 text-emerald-800';
    default: return 'bg-slate-100 text-slate-600';
  }
}
