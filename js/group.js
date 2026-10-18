import { appState, persistData } from './storage.js';

export function initGroupModule() {
  const container = document.getElementById('group-items-container');
  const searchInput = document.getElementById('group-search');
  const modalGroup = document.getElementById('modal-group');
  const modalSubitem = document.getElementById('modal-subitem');
  const formGroup = document.getElementById('form-group');
  const formSubitem = document.getElementById('form-subitem');

  const groupEditIdInput = document.getElementById('group-edit-id');
  const groupModalTitle = document.getElementById('modal-group-title');

  const groupImgUrlInput = document.getElementById('group-image-url');
  const groupImgFileInput = document.getElementById('group-image-file');
  const groupImgPreviewContainer = document.getElementById('group-image-preview-container');
  const groupImgPreview = document.getElementById('group-image-preview');
  const btnRemoveGroupImg = document.getElementById('btn-remove-group-image');
  const groupStatusMsg = document.getElementById('group-image-status');
  const groupFilenameLabel = document.getElementById('group-image-filename');

  const subitemPaySelect = document.getElementById('subitem-paystatus-select');
  const subitemDepositContainer = document.getElementById('subitem-deposit-container');
  const subitemDepositInput = document.getElementById('subitem-deposit');
  const subitemPriceInput = document.getElementById('subitem-price');
  const subitemRemainingDisplay = document.getElementById('subitem-remaining-display');
  const subitemModalTitle = document.getElementById('modal-subitem-title');
  const subitemEditIdInput = document.getElementById('subitem-edit-id');

  function updateGroupImgPreview(src, filename = '') {
    if (src && groupImgPreviewContainer && groupImgPreview) {
      groupImgPreview.src = src;
      if (groupFilenameLabel) groupFilenameLabel.textContent = filename || '已選擇圖片';
      groupImgPreviewContainer.classList.remove('hidden');
      groupImgPreviewContainer.classList.add('flex');
      if (groupStatusMsg) {
        groupStatusMsg.textContent = '';
        groupStatusMsg.classList.add('hidden');
      }
    } else if (groupImgPreviewContainer) {
      if (groupImgPreview) groupImgPreview.src = '';
      groupImgPreviewContainer.classList.add('hidden');
      groupImgPreviewContainer.classList.remove('flex');
      if (groupStatusMsg) {
        groupStatusMsg.textContent = '';
        groupStatusMsg.classList.add('hidden');
      }
    }
  }

  function updateSubitemRemaining() {
    const price = Number(subitemPriceInput?.value) || 0;
    const deposit = Number(subitemDepositInput?.value) || 0;
    const remaining = Math.max(0, price - deposit);
    if (subitemRemainingDisplay) {
      subitemRemainingDisplay.textContent = `NT$ ${remaining.toLocaleString()}`;
    }
  }

  if (subitemPaySelect) {
    subitemPaySelect.addEventListener('change', (e) => {
      if (e.target.value === '訂金') {
        subitemDepositContainer?.classList.remove('hidden');
        if (subitemDepositInput) subitemDepositInput.required = true;
        updateSubitemRemaining();
      } else {
        subitemDepositContainer?.classList.add('hidden');
        if (subitemDepositInput) {
          subitemDepositInput.required = false;
          subitemDepositInput.value = 0;
        }
      }
    });
  }

  if (subitemPriceInput) subitemPriceInput.addEventListener('input', updateSubitemRemaining);
  if (subitemDepositInput) subitemDepositInput.addEventListener('input', updateSubitemRemaining);

  if (groupImgFileInput) {
    groupImgFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (groupStatusMsg) {
        groupStatusMsg.textContent = '⏳ 正在讀取並壓縮圖片，請稍候...';
        groupStatusMsg.className = 'mt-1.5 text-xs text-indigo-600 font-medium';
        groupStatusMsg.classList.remove('hidden');
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const maxWidth = 800, maxHeight = 800;
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', 0.75);
          if (groupImgUrlInput) groupImgUrlInput.value = base64;
          updateGroupImgPreview(base64, file.name);
        };
        img.onerror = () => {
          if (groupStatusMsg) {
            groupStatusMsg.textContent = '❌ 圖片讀取失敗，請重試';
            groupStatusMsg.className = 'mt-1.5 text-xs text-rose-500 font-medium';
            groupStatusMsg.classList.remove('hidden');
          }
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  if (groupImgUrlInput) {
    groupImgUrlInput.addEventListener('input', (e) => updateGroupImgPreview(e.target.value.trim(), '外部圖片網址'));
  }

  if (btnRemoveGroupImg) {
    btnRemoveGroupImg.addEventListener('click', () => {
      if (groupImgUrlInput) groupImgUrlInput.value = '';
      if (groupImgFileInput) groupImgFileInput.value = '';
      updateGroupImgPreview('');
    });
  }

  // 打開新增揪團
  document.getElementById('btn-open-group-modal').addEventListener('click', () => {
    formGroup.reset();
    if (groupEditIdInput) groupEditIdInput.value = '';
    if (groupModalTitle) groupModalTitle.textContent = '發起新揪團 / 代購主檔';
    updateGroupImgPreview('');
    if (groupImgFileInput) groupImgFileInput.value = '';
    modalGroup.classList.remove('hidden');
  });

  document.getElementById('btn-cancel-group').addEventListener('click', () => {
    formGroup.reset();
    if (groupEditIdInput) groupEditIdInput.value = '';
    updateGroupImgPreview('');
    if (groupImgFileInput) groupImgFileInput.value = '';
    modalGroup.classList.add('hidden');
  });

  // 主檔提交 (新增 / 編輯)
  formGroup.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(formGroup);
    const editId = groupEditIdInput ? groupEditIdInput.value : '';
    const costJpy = Number(fd.get('costJpy')) || 0;
    const costTwd = Number(fd.get('costTwd')) || 0;
    const categoryCostJpy = Number(fd.get('categoryCostJpy')) || 0;
    const categoryCostTwd = Number(fd.get('categoryCostTwd')) || 0;
    const imageUrl = (groupImgUrlInput ? groupImgUrlInput.value.trim() : (fd.get('imageUrl') || ''));

    if (editId) {
      const targetGroup = appState.groupOrders.find(g => g.id === editId);
      if (targetGroup) {
        targetGroup.name = fd.get('name');
        targetGroup.imageUrl = imageUrl;
        targetGroup.orderDate = fd.get('orderDate') || '';
        targetGroup.seller = fd.get('seller') || '';
        targetGroup.costJpy = costJpy;
        targetGroup.costTwd = costTwd;
        targetGroup.needSecondPay = fd.get('needSecondPay') || '否';
        targetGroup.category = fd.get('category') || '';
        targetGroup.categoryCostJpy = categoryCostJpy;
        targetGroup.categoryCostTwd = categoryCostTwd;
        targetGroup.notes = fd.get('notes') || '';
      }
    } else {
      const newGroup = {
        id: 'g_' + Date.now(),
        name: fd.get('name'),
        imageUrl,
        orderDate: fd.get('orderDate') || '',
        seller: fd.get('seller') || '',
        costJpy,
        costTwd,
        needSecondPay: fd.get('needSecondPay') || '否',
        category: fd.get('category') || '',
        categoryCostJpy,
        categoryCostTwd,
        notes: fd.get('notes') || '',
        isExpanded: true,
        items: []
      };
      appState.groupOrders.unshift(newGroup);
    }

    persistData();
    formGroup.reset();
    if (groupEditIdInput) groupEditIdInput.value = '';
    updateGroupImgPreview('');
    if (groupImgFileInput) groupImgFileInput.value = '';
    modalGroup.classList.add('hidden');
  });

  // 認領明細 Modal 取消
  document.getElementById('btn-cancel-subitem').addEventListener('click', () => {
    formSubitem.reset();
    if (subitemEditIdInput) subitemEditIdInput.value = '';
    subitemDepositContainer?.classList.add('hidden');
    modalSubitem.classList.add('hidden');
  });

  // 認領明細提交 (新增 / 編輯)
  formSubitem.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(formSubitem);
    const groupId = document.getElementById('subitem-group-id').value;
    const subitemId = subitemEditIdInput ? subitemEditIdInput.value : '';
    const targetGroup = appState.groupOrders.find(g => g.id === groupId);

    const price = Number(fd.get('price')) || 0;
    const payStatus = fd.get('payStatus') || '未匯款';
    const deposit = payStatus === '訂金' ? (Number(fd.get('deposit')) || 0) : 0;
    const remaining = Math.max(0, price - deposit);

    if (targetGroup) {
      if (!targetGroup.items) targetGroup.items = [];

      if (subitemId) {
        const item = targetGroup.items.find(i => i.id === subitemId);
        if (item) {
          item.characterName = fd.get('characterName');
          item.buyer = fd.get('buyer') || '未認領';
          item.price = price;
          item.payStatus = payStatus;
          item.deposit = deposit;
          item.remaining = remaining;
          item.buyerNote = fd.get('buyerNote') || '';
        }
      } else {
        targetGroup.items.push({
          id: 'c_' + Date.now(),
          characterName: fd.get('characterName'),
          buyer: fd.get('buyer') || '未認領',
          price,
          payStatus,
          deposit,
          remaining,
          buyerNote: fd.get('buyerNote') || ''
        });
      }
      persistData();
    }

    formSubitem.reset();
    if (subitemEditIdInput) subitemEditIdInput.value = '';
    subitemDepositContainer?.classList.add('hidden');
    modalSubitem.classList.add('hidden');
  });

  searchInput.addEventListener('input', () => renderGroupList());
}

export function renderGroupList() {
  const container = document.getElementById('group-items-container');
  const query = document.getElementById('group-search').value.trim().toLowerCase();

  const filtered = appState.groupOrders.filter(group => {
    const groupNameMatch = (group.name || '').toLowerCase().includes(query);
    const sellerMatch = (group.seller || '').toLowerCase().includes(query);
    const categoryMatch = (group.category || '').toLowerCase().includes(query);
    const subItemMatch = (group.items || []).some(item => 
      (item.characterName || '').toLowerCase().includes(query) || 
      (item.buyer || '').toLowerCase().includes(query)
    );
    return groupNameMatch || sellerMatch || categoryMatch || subItemMatch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="text-center py-12 text-slate-400 text-sm">暫無揪團與代購資料</div>`;
    return;
  }

  container.innerHTML = filtered.map(group => {
    // 我付給代購的錢 = 總金額台幣 + 類別台幣
    const proxyPaidTwd = (group.costTwd || 0) + (group.categoryCostTwd || 0);
    const proxyPaidJpy = (group.costJpy || 0) + (group.categoryCostJpy || 0);

    // 我賣的價格總額 = 角色認領的總價格
    const totalSellPrice = (group.items || []).reduce((sum, item) => sum + (item.price || 0), 0);

    // 計算我付給代購的錢 - 我賣的價格後的錢
    // 差額 (付給代購 - 我賣的價格): 若賣的價格大於代購款則有盈利 (totalSellPrice - proxyPaidTwd)
    const diff = proxyPaidTwd - totalSellPrice;
    const profit = totalSellPrice - proxyPaidTwd; // 實際盈虧

    return `
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm" data-id="${group.id}">
        <!-- 主檔 Header -->
        <div class="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 bg-slate-50/50">
          <div class="flex items-start space-x-3 w-full md:w-auto">
            <button class="btn-toggle-expand text-slate-400 hover:text-slate-600 transition mt-1" data-id="${group.id}">
              ${group.isExpanded ? '▼' : '▶'}
            </button>
            ${group.imageUrl ? `
              <img src="${group.imageUrl}" class="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0" alt="主檔圖片" onerror="this.remove()">
            ` : ''}
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-bold text-slate-900 text-base">${group.name}</h3>
                ${group.category ? `<span class="badge bg-indigo-50 text-indigo-700">${group.category}</span>` : ''}
                <span class="badge ${group.needSecondPay === '是' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}">
                  二補：${group.needSecondPay || '否'}
                </span>
              </div>
              <div class="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                <span>下單/預購日：${group.orderDate || '--'}</span>
                <span>賣家：${group.seller || '無'}</span>
                <span>付給代購總計：<strong class="text-slate-800">NT$ ${proxyPaidTwd.toLocaleString()}</strong> (¥ ${proxyPaidJpy.toLocaleString()})</span>
                ${group.notes ? `<span>備註：${group.notes}</span>` : ''}
              </div>
              ${group.category ? `
                <div class="text-xs text-indigo-600">
                  類別費用 (${group.category})：NT$ ${(group.categoryCostTwd || 0).toLocaleString()} (¥ ${(group.categoryCostJpy || 0).toLocaleString()})
                </div>
              ` : ''}
            </div>
          </div>

          <!-- 右側差額結算與操作按鈕 -->
          <div class="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
            <div class="text-right">
              <div class="text-[11px] text-slate-400">代購費 - 我賣的價格</div>
              <div class="text-sm font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-500'}">
                NT$ ${diff.toLocaleString()}
                <span class="text-xs font-normal">(${profit >= 0 ? '盈利 +' : '待平攤 '}${profit.toLocaleString()})</span>
              </div>
              <div class="text-[11px] text-slate-500">賣出總計：NT$ ${totalSellPrice.toLocaleString()}</div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button data-id="${group.id}" class="btn-add-subitem px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition">+ 認領</button>
              <button data-id="${group.id}" class="btn-edit-group px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 text-xs font-medium rounded-lg shadow-sm transition">編輯</button>
              <button data-id="${group.id}" class="btn-delete-group text-slate-300 hover:text-rose-500 px-2 py-1 text-sm transition">✕</button>
            </div>
          </div>
        </div>

        <!-- 角色認領列表 -->
        <div class="${group.isExpanded ? '' : 'hidden'} p-5">
          <div class="flex justify-between items-center text-xs text-slate-500 pb-3 border-b mb-3">
            <span>我付給代購：<strong class="text-slate-800">NT$ ${proxyPaidTwd.toLocaleString()}</strong> ｜ 我賣的價格：<strong class="text-indigo-600">NT$ ${totalSellPrice.toLocaleString()}</strong> ｜ 計算差額：<strong class="${profit >= 0 ? 'text-emerald-600' : 'text-rose-500'}">NT$ ${diff.toLocaleString()}</strong></span>
            <span>共 ${(group.items || []).length} 筆角色明細</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-slate-400 font-medium border-b">
                <tr>
                  <th class="pb-2">角色 / 款式</th>
                  <th class="pb-2">認領買家</th>
                  <th class="pb-2">我賣的台幣金額</th>
                  <th class="pb-2">是否匯款 / 訂金進度</th>
                  <th class="pb-2">備註說明</th>
                  <th class="pb-2 text-right">操作 (編輯 / 刪除)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${(!group.items || group.items.length === 0) ? `
                  <tr><td colspan="6" class="text-center py-4 text-slate-400">目前尚無角色認領明細，請點擊上方「+ 認領」新增</td></tr>
                ` : group.items.map(item => {
                  let payBadge = '';
                  if (item.payStatus === '已全額匯款') {
                    payBadge = '<span class="badge bg-emerald-100 text-emerald-800">✓ 已全額匯款</span>';
                  } else if (item.payStatus === '訂金') {
                    const rem = Math.max(0, (item.price || 0) - (item.deposit || 0));
                    payBadge = `
                      <div>
                        <span class="badge bg-amber-100 text-amber-800">已收訂金 NT$ ${(item.deposit || 0).toLocaleString()}</span>
                        <div class="text-[11px] text-rose-500 mt-0.5 font-medium">還需付款：NT$ ${rem.toLocaleString()}</div>
                      </div>
                    `;
                  } else {
                    payBadge = '<span class="badge bg-rose-100 text-rose-700">✕ 未匯款</span>';
                  }

                  return `
                    <tr class="hover:bg-slate-50/50">
                      <td class="py-2.5 font-bold text-slate-800">${item.characterName}</td>
                      <td class="py-2.5 font-medium text-slate-600">${item.buyer}</td>
                      <td class="py-2.5 font-semibold text-slate-900">NT$ ${(item.price || 0).toLocaleString()}</td>
                      <td class="py-2.5">${payBadge}</td>
                      <td class="py-2.5 text-slate-400 truncate max-w-[150px]">${item.buyerNote || '--'}</td>
                      <td class="py-2.5 text-right space-x-1.5 whitespace-nowrap">
                        <button data-gid="${group.id}" data-cid="${item.id}" class="btn-edit-subitem px-2 py-0.5 text-xs text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 hover:border-indigo-300 rounded shadow-sm">編輯</button>
                        <button data-gid="${group.id}" data-cid="${item.id}" class="btn-delete-subitem text-slate-300 hover:text-rose-500 px-1 py-0.5">✕</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
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

  // 收合 / 展開
  container.querySelectorAll('.btn-toggle-expand').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = appState.groupOrders.find(item => item.id === btn.dataset.id);
      if (g) {
        g.isExpanded = !g.isExpanded;
        persistData();
      }
    });
  });

  // 編輯主檔
  container.querySelectorAll('.btn-edit-group').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = appState.groupOrders.find(item => item.id === btn.dataset.id);
      if (!g) return;

      const modal = document.getElementById('modal-group');
      const form = document.getElementById('form-group');
      const title = document.getElementById('modal-group-title');
      const editIdInput = document.getElementById('group-edit-id');
      const groupImgUrlInput = document.getElementById('group-image-url');
      const groupImgPreviewContainer = document.getElementById('group-image-preview-container');
      const groupImgPreview = document.getElementById('group-image-preview');
      const groupFilenameLabel = document.getElementById('group-image-filename');

      if (editIdInput) editIdInput.value = g.id;
      if (title) title.textContent = '編輯揪團 / 代購主檔';

      form.elements['name'].value = g.name || '';
      if (groupImgUrlInput) groupImgUrlInput.value = g.imageUrl || '';
      if (g.imageUrl && groupImgPreviewContainer && groupImgPreview) {
        groupImgPreview.src = g.imageUrl;
        if (groupFilenameLabel) groupFilenameLabel.textContent = '已保存圖片';
        groupImgPreviewContainer.classList.remove('hidden');
        groupImgPreviewContainer.classList.add('flex');
      } else if (groupImgPreviewContainer) {
        groupImgPreviewContainer.classList.add('hidden');
        groupImgPreviewContainer.classList.remove('flex');
      }

      form.elements['orderDate'].value = g.orderDate || '';
      form.elements['seller'].value = g.seller || '';
      form.elements['costJpy'].value = g.costJpy || 0;
      form.elements['costTwd'].value = g.costTwd || 0;
      form.elements['needSecondPay'].value = g.needSecondPay || '否';
      form.elements['category'].value = g.category || '';
      form.elements['categoryCostJpy'].value = g.categoryCostJpy || 0;
      form.elements['categoryCostTwd'].value = g.categoryCostTwd || 0;
      form.elements['notes'].value = g.notes || '';

      modal.classList.remove('hidden');
    });
  });

  // 刪除主檔
  container.querySelectorAll('.btn-delete-group').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('確定刪除此揪團主檔與其所有角色認領明細嗎？')) {
        appState.groupOrders = appState.groupOrders.filter(g => g.id !== btn.dataset.id);
        persistData();
      }
    });
  });

  // 新增角色認領
  container.querySelectorAll('.btn-add-subitem').forEach(btn => {
    btn.addEventListener('click', () => {
      const form = document.getElementById('form-subitem');
      form.reset();
      document.getElementById('subitem-group-id').value = btn.dataset.id;
      const editIdInput = document.getElementById('subitem-edit-id');
      if (editIdInput) editIdInput.value = '';
      const title = document.getElementById('modal-subitem-title');
      if (title) title.textContent = '新增認領角色';
      document.getElementById('subitem-deposit-container')?.classList.add('hidden');
      document.getElementById('modal-subitem').classList.remove('hidden');
    });
  });

  // 編輯角色認領
  container.querySelectorAll('.btn-edit-subitem').forEach(btn => {
    btn.addEventListener('click', () => {
      const gid = btn.dataset.gid;
      const cid = btn.dataset.cid;
      const group = appState.groupOrders.find(g => g.id === gid);
      const item = group?.items?.find(i => i.id === cid);
      if (!group || !item) return;

      const form = document.getElementById('form-subitem');
      document.getElementById('subitem-group-id').value = gid;
      const editIdInput = document.getElementById('subitem-edit-id');
      if (editIdInput) editIdInput.value = item.id;
      const title = document.getElementById('modal-subitem-title');
      if (title) title.textContent = '編輯認領角色';

      form.elements['characterName'].value = item.characterName || '';
      form.elements['buyer'].value = item.buyer || '';
      form.elements['price'].value = item.price || 0;
      form.elements['payStatus'].value = item.payStatus || (item.firstPaid ? '已全額匯款' : '未匯款');
      form.elements['buyerNote'].value = item.buyerNote || '';

      const depContainer = document.getElementById('subitem-deposit-container');
      const depInput = document.getElementById('subitem-deposit');
      const remDisplay = document.getElementById('subitem-remaining-display');

      if (form.elements['payStatus'].value === '訂金') {
        depContainer?.classList.remove('hidden');
        if (depInput) depInput.value = item.deposit || 0;
        const rem = Math.max(0, (item.price || 0) - (item.deposit || 0));
        if (remDisplay) remDisplay.textContent = `NT$ ${rem.toLocaleString()}`;
      } else {
        depContainer?.classList.add('hidden');
        if (depInput) depInput.value = 0;
      }

      document.getElementById('modal-subitem').classList.remove('hidden');
    });
  });

  // 刪除角色認領
  container.querySelectorAll('.btn-delete-subitem').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('確定刪除此筆角色認領明細嗎？')) {
        const group = appState.groupOrders.find(g => g.id === btn.dataset.gid);
        if (group && group.items) {
          group.items = group.items.filter(i => i.id !== btn.dataset.cid);
          persistData();
        }
      }
    });
  });
}
