import { appState, persistData } from './storage.js';

export function initGroupModule() {
  const container = document.getElementById('group-items-container');
  const searchInput = document.getElementById('group-search');

  // Modals & Forms
  const modalGroup = document.getElementById('modal-group');
  const modalCategory = document.getElementById('modal-category');
  const modalSubitem = document.getElementById('modal-subitem');

  const formGroup = document.getElementById('form-group');
  const formCategory = document.getElementById('form-category');
  const formSubitem = document.getElementById('form-subitem');

  // Elements in Group Modal
  const groupEditIdInput = document.getElementById('group-edit-id');
  const groupModalTitle = document.getElementById('modal-group-title');
  const groupImgUrlInput = document.getElementById('group-image-url');
  const groupImgFileInput = document.getElementById('group-image-file');
  const groupImgPreviewContainer = document.getElementById('group-image-preview-container');
  const groupImgPreview = document.getElementById('group-image-preview');
  const btnRemoveGroupImg = document.getElementById('btn-remove-group-image');
  const groupStatusMsg = document.getElementById('group-image-status');
  const groupFilenameLabel = document.getElementById('group-image-filename');
  const groupNeedSecondPay = document.getElementById('group-need-secondpay');
  const groupSecondPayContainer = document.getElementById('group-secondpay-amount-container');
  const groupSecondPayAmount = document.getElementById('group-secondpay-amount');

  // Elements in Category Modal (第2層)
  const categoryGroupIdInput = document.getElementById('category-group-id');
  const categoryEditIdInput = document.getElementById('category-edit-id');
  const categoryModalTitle = document.getElementById('modal-category-title');
  const categoryQtyInput = document.getElementById('category-qty');
  const categoryUnitJpyInput = document.getElementById('category-unit-jpy');
  const categoryUnitTwdInput = document.getElementById('category-unit-twd');
  const categoryCalcTwd = document.getElementById('category-calc-twd');
  const categoryCalcJpy = document.getElementById('category-calc-jpy');
  const categoryItemsPerBoxInput = document.getElementById('category-items-per-box');
  const categoryCalcTotalItems = document.getElementById('category-calc-total-items');

  // Elements in Subitem Modal (第3層)
  const subitemGroupIdInput = document.getElementById('subitem-group-id');
  const subitemCategoryIdInput = document.getElementById('subitem-category-id');
  const subitemEditIdInput = document.getElementById('subitem-edit-id');
  const subitemModalTitle = document.getElementById('modal-subitem-title');
  const subitemQtyInput = document.getElementById('subitem-qty');
  const subitemPriceInput = document.getElementById('subitem-price');
  const subitemTotalDisplay = document.getElementById('subitem-total-display');
  const subitemPaySelect = document.getElementById('subitem-paystatus-select');
  const subitemDepositContainer = document.getElementById('subitem-deposit-container');
  const subitemDepositInput = document.getElementById('subitem-deposit');
  const subitemRemainingDisplay = document.getElementById('subitem-remaining-display');
  const subitemShippingSelect = document.getElementById('subitem-shipping-select');

  // 圖片預覽輔助
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

  // 二補欄位切換
  if (groupNeedSecondPay) {
    groupNeedSecondPay.addEventListener('change', (e) => {
      if (e.target.value === '是') {
        groupSecondPayContainer?.classList.remove('hidden');
      } else {
        groupSecondPayContainer?.classList.add('hidden');
        if (groupSecondPayAmount) groupSecondPayAmount.value = 0;
      }
    });
  }

  // 第 2 層：類別即時總額與總入數試算
  function updateCategoryCalc() {
    const qty = Math.max(1, parseInt(categoryQtyInput?.value, 10) || 1);
    const perBox = Math.max(1, parseInt(categoryItemsPerBoxInput?.value, 10) || 1);
    const totalPieces = qty * perBox;
    if (categoryCalcTotalItems) {
      categoryCalcTotalItems.textContent = `${perBox} 個/盒 × ${qty} 盒 = 共 ${totalPieces} 個`;
    }
    const unitTwd = Number(categoryUnitTwdInput?.value) || 0;
    const unitJpy = Number(categoryUnitJpyInput?.value) || 0;
    if (categoryCalcTwd) categoryCalcTwd.textContent = `NT$ ${(unitTwd * qty).toLocaleString()}`;
    if (categoryCalcJpy) categoryCalcJpy.textContent = `¥ ${(unitJpy * qty).toLocaleString()}`;
  }

  categoryQtyInput?.addEventListener('input', updateCategoryCalc);
  categoryItemsPerBoxInput?.addEventListener('input', updateCategoryCalc);
  categoryUnitTwdInput?.addEventListener('input', updateCategoryCalc);
  categoryUnitJpyInput?.addEventListener('input', updateCategoryCalc);

  // 第 3 層：認領即時總額與剩餘待補款試算
  function updateSubitemCalc() {
    const qty = Math.max(1, parseInt(subitemQtyInput?.value, 10) || 1);
    const unitPrice = Number(subitemPriceInput?.value) || 0;
    const totalPrice = unitPrice * qty;
    const deposit = Number(subitemDepositInput?.value) || 0;
    const remaining = Math.max(0, totalPrice - deposit);

    if (subitemTotalDisplay) {
      subitemTotalDisplay.textContent = `NT$ ${totalPrice.toLocaleString()}`;
    }
    if (subitemRemainingDisplay) {
      subitemRemainingDisplay.textContent = `NT$ ${remaining.toLocaleString()}`;
    }
  }

  subitemQtyInput?.addEventListener('input', updateSubitemCalc);
  subitemPriceInput?.addEventListener('input', updateSubitemCalc);
  subitemDepositInput?.addEventListener('input', updateSubitemCalc);

  if (subitemPaySelect) {
    subitemPaySelect.addEventListener('change', (e) => {
      if (e.target.value === '訂金') {
        subitemDepositContainer?.classList.remove('hidden');
        if (subitemDepositInput) subitemDepositInput.required = true;
        updateSubitemCalc();
      } else {
        subitemDepositContainer?.classList.add('hidden');
        if (subitemDepositInput) {
          subitemDepositInput.required = false;
          subitemDepositInput.value = 0;
        }
      }
    });
  }

  // 動態搜集歷史所有買家名單，填入 datalist 下拉選單中
  function updateBuyerDatalist() {
    const buyers = new Set();
    (appState.groupOrders || []).forEach(g => {
      (g.categories || []).forEach(c => {
        (c.items || []).forEach(i => {
          if (i.buyer && i.buyer.trim() && i.buyer.trim() !== '未認領') {
            buyers.add(i.buyer.trim());
          }
        });
      });
    });
    const datalist = document.getElementById('buyer-datalist');
    if (datalist) {
      datalist.innerHTML = Array.from(buyers).sort().map(b => `<option value="${b}">`).join('');
    }
  }
  updateBuyerDatalist();

  // 本機圖片選取上傳 (第1層主團)
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

  // --- 第1層：主團 Modal 控制 ---
  document.getElementById('btn-open-group-modal').addEventListener('click', () => {
    formGroup.reset();
    if (groupEditIdInput) groupEditIdInput.value = '';
    if (groupModalTitle) groupModalTitle.textContent = '發起新揪團主檔';
    if (groupSecondPayContainer) groupSecondPayContainer.classList.add('hidden');
    if (groupSecondPayAmount) groupSecondPayAmount.value = 0;
    updateGroupImgPreview('');
    if (groupImgFileInput) groupImgFileInput.value = '';
    modalGroup.classList.remove('hidden');
  });

  document.getElementById('btn-cancel-group').addEventListener('click', () => {
    formGroup.reset();
    if (groupEditIdInput) groupEditIdInput.value = '';
    if (groupSecondPayContainer) groupSecondPayContainer.classList.add('hidden');
    updateGroupImgPreview('');
    if (groupImgFileInput) groupImgFileInput.value = '';
    modalGroup.classList.add('hidden');
  });

  formGroup.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(formGroup);
    const editId = groupEditIdInput ? groupEditIdInput.value : '';
    const imageUrl = (groupImgUrlInput ? groupImgUrlInput.value.trim() : (fd.get('imageUrl') || ''));
    const needSecondPay = groupNeedSecondPay ? groupNeedSecondPay.value : (fd.get('needSecondPay') || '否');
    const secondPayAmount = needSecondPay === '是' ? (Number(groupSecondPayAmount?.value) || 0) : 0;

    if (editId) {
      const targetGroup = appState.groupOrders.find(g => g.id === editId);
      if (targetGroup) {
        targetGroup.name = fd.get('name');
        targetGroup.imageUrl = imageUrl;
        targetGroup.orderDate = fd.get('orderDate') || '';
        targetGroup.seller = fd.get('seller') || '';
        targetGroup.needSecondPay = needSecondPay;
        targetGroup.secondPayAmount = secondPayAmount;
        targetGroup.notes = fd.get('notes') || '';
      }
    } else {
      const newGroup = {
        id: 'g_' + Date.now(),
        name: fd.get('name'),
        imageUrl,
        orderDate: fd.get('orderDate') || '',
        seller: fd.get('seller') || '',
        needSecondPay,
        secondPayAmount,
        notes: fd.get('notes') || '',
        isExpanded: true,
        categories: []
      };
      appState.groupOrders.unshift(newGroup);
    }

    persistData();
    formGroup.reset();
    if (groupEditIdInput) groupEditIdInput.value = '';
    if (groupSecondPayContainer) groupSecondPayContainer.classList.add('hidden');
    updateGroupImgPreview('');
    if (groupImgFileInput) groupImgFileInput.value = '';
    modalGroup.classList.add('hidden');
  });

  // --- 第2層：類別 Modal 控制 ---
  document.getElementById('btn-cancel-category').addEventListener('click', () => {
    formCategory.reset();
    if (categoryEditIdInput) categoryEditIdInput.value = '';
    modalCategory.classList.add('hidden');
  });

  formCategory.addEventListener('submit', (e) => {
    e.preventDefault();
    const groupId = categoryGroupIdInput.value;
    const categoryId = categoryEditIdInput ? categoryEditIdInput.value : '';
    const targetGroup = appState.groupOrders.find(g => g.id === groupId);

    if (targetGroup) {
      if (!targetGroup.categories) targetGroup.categories = [];
      const quantity = Math.max(1, parseInt(categoryQtyInput?.value, 10) || 1);
      const itemsPerBox = Math.max(1, parseInt(categoryItemsPerBoxInput?.value, 10) || 1);
      const costJpy = Number(categoryUnitJpyInput?.value) || 0;
      const costTwd = Number(categoryUnitTwdInput?.value) || 0;
      const name = formCategory.elements['name']?.value.trim() || '未命名類別';

      if (categoryId) {
        const cat = targetGroup.categories.find(c => c.id === categoryId);
        if (cat) {
          cat.name = name;
          cat.quantity = quantity;
          cat.itemsPerBox = itemsPerBox;
          cat.costJpy = costJpy;
          cat.costTwd = costTwd;
        }
      } else {
        targetGroup.categories.push({
          id: 'cat_' + Date.now(),
          name,
          quantity,
          itemsPerBox,
          costJpy,
          costTwd,
          isExpanded: true,
          items: []
        });
      }
      persistData();
    }

    formCategory.reset();
    if (categoryEditIdInput) categoryEditIdInput.value = '';
    modalCategory.classList.add('hidden');
  });

  // --- 第3層：認領角色 Modal 控制 ---
  document.getElementById('btn-cancel-subitem').addEventListener('click', () => {
    formSubitem.reset();
    if (subitemEditIdInput) subitemEditIdInput.value = '';
    subitemDepositContainer?.classList.add('hidden');
    modalSubitem.classList.add('hidden');
  });

  formSubitem.addEventListener('submit', (e) => {
    e.preventDefault();
    const groupId = subitemGroupIdInput.value;
    const categoryId = subitemCategoryIdInput.value;
    const subitemId = subitemEditIdInput ? subitemEditIdInput.value : '';

    const targetGroup = appState.groupOrders.find(g => g.id === groupId);
    const targetCategory = targetGroup?.categories?.find(c => c.id === categoryId);

    const price = Number(subitemPriceInput?.value) || 0;
    const quantity = Math.max(1, parseInt(subitemQtyInput?.value, 10) || 1);
    const totalPrice = price * quantity;
    const payStatus = formSubitem.elements['payStatus']?.value || '未匯款';
    const deposit = payStatus === '訂金' ? (Number(subitemDepositInput?.value) || 0) : 0;
    const remaining = Math.max(0, totalPrice - deposit);
    const shippingStatus = subitemShippingSelect ? subitemShippingSelect.value : '未寄出';
    const characterName = formSubitem.elements['characterName']?.value.trim() || '';
    const buyer = formSubitem.elements['buyer']?.value.trim() || '未認領';
    const buyerNote = formSubitem.elements['buyerNote']?.value.trim() || '';

    if (targetCategory) {
      if (!targetCategory.items) targetCategory.items = [];

      if (subitemId) {
        const item = targetCategory.items.find(i => i.id === subitemId);
        if (item) {
          item.characterName = characterName;
          item.buyer = buyer;
          item.quantity = quantity;
          item.price = price;
          item.totalPrice = totalPrice;
          item.payStatus = payStatus;
          item.deposit = deposit;
          item.remaining = remaining;
          item.shippingStatus = shippingStatus;
          item.buyerNote = buyerNote;
        }
      } else {
        targetCategory.items.push({
          id: 'sub_' + Date.now(),
          characterName,
          buyer,
          quantity,
          price,
          totalPrice,
          payStatus,
          deposit,
          remaining,
          shippingStatus,
          buyerNote
        });
      }
      persistData();
      updateBuyerDatalist();
    }

    formSubitem.reset();
    if (subitemEditIdInput) subitemEditIdInput.value = '';
    subitemDepositContainer?.classList.add('hidden');
    modalSubitem.classList.add('hidden');
  });

  searchInput.addEventListener('input', () => renderGroupList());
}

// 輔助函式：確保資料結構完整且正確相容
function normalizeGroup(group) {
  if (!group.categories) {
    group.categories = [];
  }
  if (group.items && group.items.length > 0 && group.categories.length === 0) {
    group.categories.push({
      id: 'cat_legacy_' + group.id,
      name: group.category || '預設類別',
      quantity: 1,
      costJpy: group.categoryCostJpy || 0,
      costTwd: group.categoryCostTwd || 0,
      isExpanded: true,
      items: group.items
    });
    delete group.items;
  }
  group.categories.forEach(cat => {
    if (typeof cat.quantity !== 'number' || isNaN(cat.quantity) || cat.quantity < 1) {
      cat.quantity = 1;
    }
    if (typeof cat.itemsPerBox !== 'number' || isNaN(cat.itemsPerBox) || cat.itemsPerBox < 1) {
      cat.itemsPerBox = 1;
    }
    if (typeof cat.isExpanded !== 'boolean') {
      cat.isExpanded = true;
    }
    (cat.items || []).forEach(item => {
      if (typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity < 1) {
        item.quantity = 1;
      }
      if (!item.shippingStatus) {
        item.shippingStatus = '未寄出';
      }
    });
  });
}

export function renderGroupList() {
  const container = document.getElementById('group-items-container');
  const query = document.getElementById('group-search').value.trim().toLowerCase();

  const filtered = (appState.groupOrders || []).filter(group => {
    normalizeGroup(group);
    const groupNameMatch = (group.name || '').toLowerCase().includes(query);
    const sellerMatch = (group.seller || '').toLowerCase().includes(query);
    const catMatch = (group.categories || []).some(cat => 
      (cat.name || '').toLowerCase().includes(query) || 
      (cat.items || []).some(item => 
        (item.characterName || '').toLowerCase().includes(query) || 
        (item.buyer || '').toLowerCase().includes(query)
      )
    );
    return groupNameMatch || sellerMatch || catMatch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="text-center py-12 text-slate-400 text-sm">暫無揪團與代購資料</div>`;
    return;
  }

  container.innerHTML = filtered.map(group => {
    normalizeGroup(group);

    // 第一層日幣/台幣總金額 = 第二層所有類別 (單價 × 數量) 的加總
    const totalProxyPaidTwd = (group.categories || []).reduce((sum, cat) => sum + ((cat.costTwd || 0) * (cat.quantity || 1)), 0);
    const totalProxyPaidJpy = (group.categories || []).reduce((sum, cat) => sum + ((cat.costJpy || 0) * (cat.quantity || 1)), 0);

    // 第一層所有第三層買家台幣總售價加總 (單價 × 數量)
    let totalSellPrice = 0;
    let totalItemsCount = 0;

    (group.categories || []).forEach(cat => {
      (cat.items || []).forEach(item => {
        const itemQty = item.quantity || 1;
        totalSellPrice += ((item.price || 0) * itemQty);
        totalItemsCount += itemQty;
      });
    });

    // 第一層結算: 代購成本 - 我賣的價格 = 台幣總金額 - 所有第三層的台幣價格
    const diff = totalProxyPaidTwd - totalSellPrice;
    const profit = totalSellPrice - totalProxyPaidTwd;

    return `
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm" data-id="${group.id}">
        <!-- 第 1 層：揪團主檔 Header -->
        <div class="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 bg-slate-50/70">
          <div class="flex items-start space-x-3 w-full md:w-auto">
            <button class="btn-toggle-expand text-slate-400 hover:text-slate-600 transition mt-1" data-id="${group.id}">
              ${group.isExpanded ? '▼' : '▶'}
            </button>
            ${group.imageUrl ? `
              <img src="${group.imageUrl}" class="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0" alt="主團圖片" onerror="this.remove()">
            ` : ''}
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-bold text-slate-900 text-base">${group.name}</h3>
                <span class="badge ${group.needSecondPay === '是' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}">
                  二補：${group.needSecondPay || '否'}${group.needSecondPay === '是' && group.secondPayAmount ? ` (NT$ ${Number(group.secondPayAmount).toLocaleString()})` : ''}
                </span>
                <span class="badge bg-indigo-50 text-indigo-700 font-normal">
                  ${(group.categories || []).length} 個類別 / ${totalItemsCount} 件認領
                </span>
              </div>
              <div class="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                <span>下單日：${group.orderDate || '--'}</span>
                <span>賣家：${group.seller || '無'}</span>
                <span>總金額：<strong class="text-slate-800">NT$ ${totalProxyPaidTwd.toLocaleString()}</strong> (¥ ${totalProxyPaidJpy.toLocaleString()})</span>
                ${group.needSecondPay === '是' && group.secondPayAmount ? `<span class="text-amber-700 font-medium">二補價格：NT$ ${Number(group.secondPayAmount).toLocaleString()}</span>` : ''}
                ${group.notes ? `<span>備註：${group.notes}</span>` : ''}
              </div>
            </div>
          </div>

          <!-- 右側差額結算與主團操作 -->
          <div class="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
            <div class="text-right">
              <div class="text-[11px] text-slate-500 font-medium">代購成本 - 我賣的價格 (總結算)</div>
              <div class="text-sm font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-500'}">
                NT$ ${diff.toLocaleString()}
                <span class="text-xs font-normal">(${profit >= 0 ? '盈利 +' : '待平攤 '}${profit.toLocaleString()})</span>
              </div>
              <div class="text-[11px] text-slate-500">
                付代購總計：NT$ ${totalProxyPaidTwd.toLocaleString()} (¥ ${totalProxyPaidJpy.toLocaleString()}) ｜ 賣出總計：NT$ ${totalSellPrice.toLocaleString()}
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button data-id="${group.id}" class="btn-add-category px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition">
                + 新增類別
              </button>
              <button data-id="${group.id}" class="btn-edit-group px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 text-xs font-medium rounded-lg shadow-sm transition">
                編輯
              </button>
              <button data-id="${group.id}" class="btn-delete-group text-slate-300 hover:text-rose-500 px-2 py-1 text-sm transition">
                ✕
              </button>
            </div>
          </div>
        </div>

        <!-- 主檔展開內容：第 2 層類別清單 -->
        <div class="${group.isExpanded ? '' : 'hidden'} p-5 space-y-5 bg-slate-50/30">
          ${(group.categories || []).length === 0 ? `
            <div class="text-center py-6 text-slate-400 text-xs bg-white rounded-lg border border-dashed border-slate-200">
              目前尚未新增任何類別 (例如徽章、小卡等)，請點擊右上角「+ 新增類別」
            </div>
          ` : group.categories.map(cat => {
            const catQty = cat.quantity || 1;
            // 第二層類別總金額 = 1個單價 × 數量
            const catTotalCostTwd = (cat.costTwd || 0) * catQty;
            const catTotalCostJpy = (cat.costJpy || 0) * catQty;

            // 第二層所有認領賣家售價加總
            const catSellPrice = (cat.items || []).reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
            // 第二層顯示目前這類別的金額 - 第三層所有買家的金額
            const catDiff = catTotalCostTwd - catSellPrice;
            const isCatExpanded = cat.isExpanded !== false;

            const perBox = cat.itemsPerBox || 1;
            const catTotalPieces = catQty * perBox;
            const totalClaimedPieces = (cat.items || []).reduce((s, i) => s + (i.quantity || 1), 0);

            return `
              <div class="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden" data-cid="${cat.id}">
                <!-- 第 2 層：類別標題列 (具備收起/展開按鈕) -->
                <div class="p-3.5 bg-indigo-50/40 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div class="flex items-center space-x-2">
                    <button class="btn-toggle-cat-expand text-slate-400 hover:text-indigo-600 transition px-1" data-gid="${group.id}" data-cid="${cat.id}">
                      ${isCatExpanded ? '▼' : '▶'}
                    </button>
                    <span class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      🏷️ ${cat.name}
                      <span class="text-xs bg-white text-indigo-700 font-semibold px-2 py-0.5 rounded border border-indigo-200">
                        × ${catQty} 盒 ${cat.itemsPerBox ? `(${perBox} 個/盒，共 ${catTotalPieces} 個)` : ''}
                      </span>
                    </span>
                    <span class="text-xs text-slate-500">
                      (單盒：NT$ ${(cat.costTwd || 0).toLocaleString()} / ¥ ${(cat.costJpy || 0).toLocaleString()} ｜ 類別總金額：<strong class="text-slate-800">NT$ ${catTotalCostTwd.toLocaleString()}</strong> / ¥ ${catTotalCostJpy.toLocaleString()})
                    </span>
                  </div>
                  <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div class="text-xs text-slate-600">
                      <span>類別結算 (類別總額 - 買家金額)：</span>
                      <strong class="${catDiff <= 0 ? 'text-emerald-600' : 'text-rose-500'}">
                        NT$ ${catDiff.toLocaleString()}
                      </strong>
                      <span class="text-[11px] text-slate-400"> (售出 NT$ ${catSellPrice.toLocaleString()})</span>
                    </div>
                    <div class="flex items-center space-x-1.5">
                      <button data-gid="${group.id}" data-cid="${cat.id}" class="btn-add-subitem px-2.5 py-1 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-xs font-medium rounded transition">
                        + 新增認領
                      </button>
                      <button data-gid="${group.id}" data-cid="${cat.id}" class="btn-edit-category px-2 py-1 text-slate-500 hover:text-indigo-600 text-xs transition">
                        編輯類別
                      </button>
                      <button data-gid="${group.id}" data-cid="${cat.id}" class="btn-delete-category text-slate-300 hover:text-rose-500 px-1.5 py-1 text-xs transition">
                        ✕
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 第 3 層：認領角色買家表格 (可收起) -->
                <div class="${isCatExpanded ? '' : 'hidden'} p-4 overflow-x-auto">
                  <table class="w-full text-left text-xs">
                    <thead class="text-slate-400 font-medium border-b border-slate-100">
                      <tr>
                        <th class="pb-2">角色 / 款式</th>
                        <th class="pb-2">認領買家</th>
                        <th class="pb-2">數量</th>
                        <th class="pb-2">單價</th>
                        <th class="pb-2">總金額</th>
                        <th class="pb-2">是否匯款 / 訂金狀況</th>
                        <th class="pb-2">寄送狀態</th>
                        <th class="pb-2">備註說明</th>
                        <th class="pb-2 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                      ${(!cat.items || cat.items.length === 0) ? `
                        <tr><td colspan="9" class="text-center py-3 text-slate-400">此類別尚無認領角色，點擊上方「+ 新增認領」開始認領</td></tr>
                      ` : cat.items.map(item => {
                        const itemQty = item.quantity || 1;
                        const itemTotal = (item.price || 0) * itemQty;
                        let payBadge = '';
                        if (item.payStatus === '已全額匯款') {
                          payBadge = '<span class="badge bg-emerald-100 text-emerald-800">✓ 已全額匯款</span>';
                        } else if (item.payStatus === '訂金') {
                          const rem = Math.max(0, itemTotal - (item.deposit || 0));
                          payBadge = `
                            <div>
                              <span class="badge bg-amber-100 text-amber-800">已收訂金 NT$ ${(item.deposit || 0).toLocaleString()}</span>
                              <div class="text-[11px] text-rose-500 font-medium mt-0.5">還需付款：NT$ ${rem.toLocaleString()}</div>
                            </div>
                          `;
                        } else {
                          payBadge = '<span class="badge bg-rose-100 text-rose-700">✕ 未匯款</span>';
                        }

                        const isShipped = item.shippingStatus === '寄出';

                        return `
                          <tr class="hover:bg-slate-50/50">
                            <td class="py-2.5 font-bold text-slate-800">${item.characterName}</td>
                            <td class="py-2.5 font-medium text-slate-600">${item.buyer || '未認領'}</td>
                            <td class="py-2.5 text-slate-700 font-semibold">× ${itemQty}</td>
                            <td class="py-2.5 text-slate-600">NT$ ${(item.price || 0).toLocaleString()}</td>
                            <td class="py-2.5 font-bold text-indigo-700">NT$ ${itemTotal.toLocaleString()}</td>
                            <td class="py-2.5">${payBadge}</td>
                            <td class="py-2.5">
                              <button data-gid="${group.id}" data-cid="${cat.id}" data-sid="${item.id}" class="btn-toggle-shipping badge cursor-pointer transition ${isShipped ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                                ${isShipped ? '✓ 已寄出' : '⏳ 未寄出'}
                              </button>
                            </td>
                            <td class="py-2.5 text-slate-400 truncate max-w-[140px]">${item.buyerNote || '--'}</td>
                            <td class="py-2.5 text-right space-x-1 whitespace-nowrap">
                              <button data-gid="${group.id}" data-cid="${cat.id}" data-sid="${item.id}" class="btn-edit-subitem px-2 py-0.5 text-xs text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 hover:border-indigo-300 rounded shadow-sm transition">編輯</button>
                              <button data-gid="${group.id}" data-cid="${cat.id}" data-sid="${item.id}" class="btn-delete-subitem text-slate-300 hover:text-rose-500 px-1 py-0.5 transition">✕</button>
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                    <tfoot>
                      <tr class="bg-slate-50/90 font-bold border-t border-slate-200 text-slate-800">
                        <td colspan="2" class="py-2.5 px-3">目前總共認領數量</td>
                        <td class="py-2.5 text-indigo-600 font-bold">
                          共 ${totalClaimedPieces} 個 ${cat.itemsPerBox ? `<span class="text-[11px] font-normal text-slate-500">/ 滿團 ${catTotalPieces} 個</span>` : ''}
                        </td>
                        <td class="py-2.5 text-slate-400 font-normal">--</td>
                        <td class="py-2.5 text-indigo-700">NT$ ${catSellPrice.toLocaleString()}</td>
                        <td colspan="4" class="py-2.5 text-slate-500 text-[11px] font-normal">
                          ${cat.itemsPerBox ? (totalClaimedPieces >= catTotalPieces ? '<span class="text-emerald-600 font-semibold">✓ 已成團 (已滿額)</span>' : `<span class="text-amber-600 font-medium">尚餘 ${catTotalPieces - totalClaimedPieces} 個待認領</span>`) : `目前已認領 ${totalClaimedPieces} 個`}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  attachGroupEvents();
}

function attachGroupEvents() {
  const container = document.getElementById('group-items-container');

  // 收合 / 展開第1層主團
  container.querySelectorAll('.btn-toggle-expand').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = appState.groupOrders.find(item => item.id === btn.dataset.id);
      if (g) {
        g.isExpanded = !g.isExpanded;
        persistData();
      }
    });
  });

  // 收合 / 展開第2層類別 (跟第一層一樣)
  container.querySelectorAll('.btn-toggle-cat-expand').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = appState.groupOrders.find(item => item.id === btn.dataset.gid);
      const cat = g?.categories?.find(c => c.id === btn.dataset.cid);
      if (cat) {
        cat.isExpanded = cat.isExpanded === false ? true : false;
        persistData();
      }
    });
  });

  // 切換第3層商品寄出狀態 (未寄出 / 寄出)
  container.querySelectorAll('.btn-toggle-shipping').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = appState.groupOrders.find(item => item.id === btn.dataset.gid);
      const cat = g?.categories?.find(c => c.id === btn.dataset.cid);
      const item = cat?.items?.find(i => i.id === btn.dataset.sid);
      if (item) {
        item.shippingStatus = item.shippingStatus === '寄出' ? '未寄出' : '寄出';
        persistData();
      }
    });
  });

  // --- 第1層 主團：編輯與刪除 ---
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
      const groupNeedSecondPay = document.getElementById('group-need-secondpay');
      const groupSecondPayContainer = document.getElementById('group-secondpay-amount-container');
      const groupSecondPayAmount = document.getElementById('group-secondpay-amount');

      if (editIdInput) editIdInput.value = g.id;
      if (title) title.textContent = '編輯揪團主檔';

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
      if (groupNeedSecondPay) groupNeedSecondPay.value = g.needSecondPay || '否';
      if (groupSecondPayAmount) groupSecondPayAmount.value = g.secondPayAmount || 0;
      if (g.needSecondPay === '是') {
        groupSecondPayContainer?.classList.remove('hidden');
      } else {
        groupSecondPayContainer?.classList.add('hidden');
      }
      form.elements['notes'].value = g.notes || '';

      modal.classList.remove('hidden');
    });
  });

  container.querySelectorAll('.btn-delete-group').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('確定刪除此揪團主檔與其底下所有的類別與認領明細嗎？')) {
        appState.groupOrders = appState.groupOrders.filter(g => g.id !== btn.dataset.id);
        persistData();
      }
    });
  });

  // --- 第2層 類別：新增、編輯與刪除 ---
  container.querySelectorAll('.btn-add-category').forEach(btn => {
    btn.addEventListener('click', () => {
      const form = document.getElementById('form-category');
      form.reset();
      document.getElementById('category-group-id').value = btn.dataset.id;
      const editIdInput = document.getElementById('category-edit-id');
      if (editIdInput) editIdInput.value = '';
      const title = document.getElementById('modal-category-title');
      if (title) title.textContent = '新增商品類別 (例如：徽章、小卡)';

      document.getElementById('category-qty').value = 1;
      if (document.getElementById('category-items-per-box')) document.getElementById('category-items-per-box').value = 1;
      document.getElementById('category-unit-jpy').value = 0;
      document.getElementById('category-unit-twd').value = 0;
      updateCategoryCalc();

      document.getElementById('modal-category').classList.remove('hidden');
    });
  });

  container.querySelectorAll('.btn-edit-category').forEach(btn => {
    btn.addEventListener('click', () => {
      const gid = btn.dataset.gid;
      const cid = btn.dataset.cid;
      const group = appState.groupOrders.find(g => g.id === gid);
      const cat = group?.categories?.find(c => c.id === cid);
      if (!group || !cat) return;

      const form = document.getElementById('form-category');
      document.getElementById('category-group-id').value = gid;
      const editIdInput = document.getElementById('category-edit-id');
      if (editIdInput) editIdInput.value = cat.id;
      const title = document.getElementById('modal-category-title');
      if (title) title.textContent = '編輯商品類別';

      form.elements['name'].value = cat.name || '';
      const qty = cat.quantity || 1;
      document.getElementById('category-qty').value = qty;
      if (document.getElementById('category-items-per-box')) {
        document.getElementById('category-items-per-box').value = cat.itemsPerBox || 1;
      }
      document.getElementById('category-unit-jpy').value = cat.costJpy || 0;
      document.getElementById('category-unit-twd').value = cat.costTwd || 0;
      updateCategoryCalc();

      document.getElementById('modal-category').classList.remove('hidden');
    });
  });

  container.querySelectorAll('.btn-delete-category').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('確定刪除此類別與底下所有認領角色嗎？')) {
        const group = appState.groupOrders.find(g => g.id === btn.dataset.gid);
        if (group && group.categories) {
          group.categories = group.categories.filter(c => c.id !== btn.dataset.cid);
          persistData();
        }
      }
    });
  });

  // --- 第3層 認領角色：新增、編輯與刪除 ---
  container.querySelectorAll('.btn-add-subitem').forEach(btn => {
    btn.addEventListener('click', () => {
      const form = document.getElementById('form-subitem');
      form.reset();
      document.getElementById('subitem-group-id').value = btn.dataset.gid;
      document.getElementById('subitem-category-id').value = btn.dataset.cid;
      const editIdInput = document.getElementById('subitem-edit-id');
      if (editIdInput) editIdInput.value = '';
      const title = document.getElementById('modal-subitem-title');
      if (title) title.textContent = '新增認領角色';

      document.getElementById('subitem-qty').value = 1;
      document.getElementById('subitem-price').value = 0;
      document.getElementById('subitem-total-display').textContent = 'NT$ 0';
      if (document.getElementById('subitem-shipping-select')) {
        document.getElementById('subitem-shipping-select').value = '未寄出';
      }
      document.getElementById('subitem-deposit-container')?.classList.add('hidden');
      
      const buyers = new Set();
      (appState.groupOrders || []).forEach(g => {
        (g.categories || []).forEach(c => {
          (c.items || []).forEach(i => {
            if (i.buyer && i.buyer.trim() && i.buyer.trim() !== '未認領') {
              buyers.add(i.buyer.trim());
            }
          });
        });
      });
      const datalist = document.getElementById('buyer-datalist');
      if (datalist) {
        datalist.innerHTML = Array.from(buyers).sort().map(b => `<option value="${b}">`).join('');
      }

      document.getElementById('modal-subitem').classList.remove('hidden');
    });
  });

  container.querySelectorAll('.btn-edit-subitem').forEach(btn => {
    btn.addEventListener('click', () => {
      const gid = btn.dataset.gid;
      const cid = btn.dataset.cid;
      const sid = btn.dataset.sid;
      const group = appState.groupOrders.find(g => g.id === gid);
      const cat = group?.categories?.find(c => c.id === cid);
      const item = cat?.items?.find(i => i.id === sid);
      if (!group || !cat || !item) return;

      const form = document.getElementById('form-subitem');
      document.getElementById('subitem-group-id').value = gid;
      document.getElementById('subitem-category-id').value = cid;
      const editIdInput = document.getElementById('subitem-edit-id');
      if (editIdInput) editIdInput.value = item.id;
      const title = document.getElementById('modal-subitem-title');
      if (title) title.textContent = '編輯認領角色';

      const qty = item.quantity || 1;
      const price = item.price || 0;
      const total = price * qty;

      form.elements['characterName'].value = item.characterName || '';
      form.elements['buyer'].value = item.buyer || '';
      document.getElementById('subitem-qty').value = qty;
      document.getElementById('subitem-price').value = price;
      document.getElementById('subitem-total-display').textContent = `NT$ ${total.toLocaleString()}`;

      form.elements['payStatus'].value = item.payStatus || (item.firstPaid ? '已全額匯款' : '未匯款');
      if (document.getElementById('subitem-shipping-select')) {
        document.getElementById('subitem-shipping-select').value = item.shippingStatus || '未寄出';
      }
      form.elements['buyerNote'].value = item.buyerNote || '';

      const depContainer = document.getElementById('subitem-deposit-container');
      const depInput = document.getElementById('subitem-deposit');
      const remDisplay = document.getElementById('subitem-remaining-display');

      if (form.elements['payStatus'].value === '訂金') {
        depContainer?.classList.remove('hidden');
        if (depInput) depInput.value = item.deposit || 0;
        const rem = Math.max(0, total - (item.deposit || 0));
        if (remDisplay) remDisplay.textContent = `NT$ ${rem.toLocaleString()}`;
      } else {
        depContainer?.classList.add('hidden');
        if (depInput) depInput.value = 0;
      }

      const buyers = new Set();
      (appState.groupOrders || []).forEach(g => {
        (g.categories || []).forEach(c => {
          (c.items || []).forEach(i => {
            if (i.buyer && i.buyer.trim() && i.buyer.trim() !== '未認領') {
              buyers.add(i.buyer.trim());
            }
          });
        });
      });
      const datalist = document.getElementById('buyer-datalist');
      if (datalist) {
        datalist.innerHTML = Array.from(buyers).sort().map(b => `<option value="${b}">`).join('');
      }

      document.getElementById('modal-subitem').classList.remove('hidden');
    });
  });

  container.querySelectorAll('.btn-delete-subitem').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('確定刪除此筆角色認領明細嗎？')) {
        const group = appState.groupOrders.find(g => g.id === btn.dataset.gid);
        const cat = group?.categories?.find(c => c.id === btn.dataset.cid);
        if (cat && cat.items) {
          cat.items = cat.items.filter(i => i.id !== btn.dataset.sid);
          persistData();
        }
      }
    });
  });
}
