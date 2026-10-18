import { appState, persistData } from './storage.js';

// 圖片壓縮輔助函式
function compressImageFile(file, maxWidth = 800, maxHeight = 800, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('請選擇圖片檔案'));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
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
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('圖片讀取失敗'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('檔案讀取失敗'));
    reader.readAsDataURL(file);
  });
}

export function initSaleModule() {
  const modal = document.getElementById('modal-sale');
  const form = document.getElementById('form-sale');
  const btnOpenModal = document.getElementById('btn-open-sale-modal');
  const btnCancel = document.getElementById('btn-cancel-sale');
  const searchInput = document.getElementById('sale-search');
  const shippingFilter = document.getElementById('sale-shipping-filter');
  const payFilter = document.getElementById('sale-pay-filter');

  const editIdInput = document.getElementById('sale-edit-id');
  const modalTitle = document.getElementById('modal-sale-title');
  const payMethodSelect = document.getElementById('sale-paymethod-select');
  const depositContainer = document.getElementById('sale-deposit-container');
  const depositInput = document.getElementById('sale-deposit');
  const priceInput = document.getElementById('sale-price');
  const qtyInput = document.getElementById('sale-qty');
  const totalDisplay = document.getElementById('sale-total-display');
  const remainingDisplay = document.getElementById('sale-remaining-display');

  const imageUrlInput = document.getElementById('sale-image-url');
  const imageFileInput = document.getElementById('sale-image-file');
  const imagePreviewContainer = document.getElementById('sale-image-preview-container');
  const imagePreview = document.getElementById('sale-image-preview');
  const btnRemoveImage = document.getElementById('btn-remove-sale-image');
  const imageStatus = document.getElementById('sale-image-status');
  const imageFilename = document.getElementById('sale-image-filename');

  function updatePreview(src, filename = '') {
    if (src) {
      if (imagePreview) imagePreview.src = src;
      if (imageFilename) imageFilename.textContent = filename || '已選擇圖片';
      imagePreviewContainer?.classList.remove('hidden');
      imagePreviewContainer?.classList.add('flex');
      if (imageStatus) {
        imageStatus.textContent = '';
        imageStatus.classList.add('hidden');
      }
    } else {
      if (imagePreview) imagePreview.src = '';
      imagePreviewContainer?.classList.add('hidden');
      imagePreviewContainer?.classList.remove('flex');
      if (imageStatus) {
        imageStatus.textContent = '';
        imageStatus.classList.add('hidden');
      }
    }
  }

  function updateCalc() {
    const price = Number(priceInput?.value) || 0;
    const qty = Math.max(1, parseInt(qtyInput?.value, 10) || 1);
    const total = price * qty;
    const deposit = Number(depositInput?.value) || 0;
    const rem = Math.max(0, total - deposit);

    if (totalDisplay) totalDisplay.textContent = `NT$ ${total.toLocaleString()}`;
    if (remainingDisplay) remainingDisplay.textContent = `NT$ ${rem.toLocaleString()}`;
  }

  priceInput?.addEventListener('input', updateCalc);
  qtyInput?.addEventListener('input', updateCalc);
  depositInput?.addEventListener('input', updateCalc);

  payMethodSelect?.addEventListener('change', (e) => {
    if (e.target.value === '訂金') {
      depositContainer?.classList.remove('hidden');
      if (depositInput) depositInput.required = true;
      updateCalc();
    } else {
      depositContainer?.classList.add('hidden');
      if (depositInput) {
        depositInput.required = false;
        depositInput.value = 0;
      }
    }
  });

  if (imageFileInput) {
    imageFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        if (imageStatus) {
          imageStatus.textContent = '⏳ 正在讀取並壓縮圖片，請稍候...';
          imageStatus.className = 'mt-1.5 text-xs text-indigo-600 font-medium';
          imageStatus.classList.remove('hidden');
        }
        const compressedBase64 = await compressImageFile(file);
        if (imageUrlInput) imageUrlInput.value = compressedBase64;
        updatePreview(compressedBase64, file.name);
      } catch (err) {
        if (imageStatus) {
          imageStatus.textContent = `❌ ${err.message || '圖片讀取失敗，請重試'}`;
          imageStatus.className = 'mt-1.5 text-xs text-rose-500 font-medium';
          imageStatus.classList.remove('hidden');
        }
      }
    });
  }

  imageUrlInput?.addEventListener('input', (e) => updatePreview(e.target.value.trim(), '外部圖片網址'));
  btnRemoveImage?.addEventListener('click', () => {
    if (imageUrlInput) imageUrlInput.value = '';
    if (imageFileInput) imageFileInput.value = '';
    updatePreview('');
  });

  btnOpenModal?.addEventListener('click', () => {
    form.reset();
    if (editIdInput) editIdInput.value = '';
    if (modalTitle) modalTitle.textContent = '新增個人出物';
    if (qtyInput) qtyInput.value = 1;
    if (priceInput) priceInput.value = 0;
    if (totalDisplay) totalDisplay.textContent = 'NT$ 0';
    if (depositContainer) depositContainer.classList.add('hidden');
    updatePreview('');
    updateSaleBuyerDatalist();
    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
  });

  btnCancel?.addEventListener('click', () => {
    form.reset();
    if (editIdInput) editIdInput.value = '';
    updatePreview('');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const editId = editIdInput ? editIdInput.value : '';
    const imageUrl = imageUrlInput ? imageUrlInput.value.trim() : (fd.get('imageUrl') || '');

    const name = form.elements['name']?.value.trim() || '未命名商品';
    const channel = form.elements['channel']?.value || '賣貨便';
    const price = Number(form.elements['price']?.value) || 0;
    const quantity = Math.max(1, parseInt(form.elements['quantity']?.value, 10) || 1);
    const buyer = form.elements['buyer']?.value.trim() || '未認領';
    const payStatus = form.elements['payStatus']?.value || '未匯款';
    const deposit = payStatus === '訂金' ? (Number(form.elements['deposit']?.value) || 0) : 0;
    const shippingStatus = form.elements['shippingStatus']?.value || '未寄出';
    const saleDate = form.elements['saleDate']?.value || '';
    const notes = form.elements['notes']?.value.trim() || '';

    if (!appState.personalSales) appState.personalSales = [];

    if (editId) {
      const target = appState.personalSales.find(i => i.id === editId);
      if (target) {
        target.name = name;
        target.imageUrl = imageUrl;
        target.channel = channel;
        target.price = price;
        target.quantity = quantity;
        target.buyer = buyer;
        target.payStatus = payStatus;
        target.deposit = deposit;
        target.shippingStatus = shippingStatus;
        target.saleDate = saleDate;
        target.notes = notes;
      }
    } else {
      const newSale = {
        id: 'sale_' + Date.now(),
        name,
        imageUrl,
        channel,
        price,
        quantity,
        buyer,
        payStatus,
        deposit,
        shippingStatus,
        saleDate,
        notes
      };
      appState.personalSales.unshift(newSale);
    }

    persistData();
    form.reset();
    updatePreview('');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
  });

  searchInput?.addEventListener('input', () => renderSaleList());
  shippingFilter?.addEventListener('change', () => renderSaleList());
  payFilter?.addEventListener('change', () => renderSaleList());
}

export function updateSaleBuyerDatalist() {
  const datalist = document.getElementById('sale-buyer-datalist');
  if (!datalist) return;
  const buyers = new Set();
  (appState.groupOrders || []).forEach(g => {
    (g.categories || []).forEach(c => {
      (c.items || []).forEach(i => {
        const b = (i.buyer || '').trim();
        if (b && b !== '未認領') buyers.add(b);
      });
    });
  });
  (appState.personalSales || []).forEach(s => {
    const b = (s.buyer || '').trim();
    if (b && b !== '未認領') buyers.add(b);
  });
  datalist.innerHTML = Array.from(buyers).sort().map(b => `<option value="${b}">`).join('');
}

export function renderSaleList() {
  const container = document.getElementById('sale-items-container');
  if (!container) return;

  updateSaleBuyerDatalist();

  const query = (document.getElementById('sale-search')?.value || '').trim().toLowerCase();
  const shippingFilter = document.getElementById('sale-shipping-filter')?.value || '';
  const payFilter = document.getElementById('sale-pay-filter')?.value || '';

  const sales = appState.personalSales || [];

  const filtered = sales.filter(item => {
    const nameMatch = (item.name || '').toLowerCase().includes(query);
    const buyerMatch = (item.buyer || '').toLowerCase().includes(query);
    const channelMatch = (item.channel || '').toLowerCase().includes(query);
    const matchesSearch = nameMatch || buyerMatch || channelMatch;

    const matchesShipping = !shippingFilter || (item.shippingStatus || '未寄出') === shippingFilter;
    
    let matchesPay = true;
    if (payFilter === 'paid') {
      matchesPay = item.payStatus === '已全額匯款';
    } else if (payFilter === 'unpaid') {
      matchesPay = item.payStatus === '未匯款' || item.payStatus === '訂金' || item.payStatus === '貨到付款';
    }

    return matchesSearch && matchesShipping && matchesPay;
  });

  let totalIncome = 0;
  let totalUncollected = 0;
  let totalItemsCount = 0;
  let unshippedCount = 0;

  sales.forEach(s => {
    const qty = s.quantity || 1;
    const total = (s.price || 0) * qty;
    totalItemsCount += qty;
    if (s.payStatus === '已全額匯款') {
      totalIncome += total;
    } else if (s.payStatus === '訂金') {
      totalIncome += (s.deposit || 0);
      totalUncollected += Math.max(0, total - (s.deposit || 0));
    } else {
      totalUncollected += total;
    }
    if ((s.shippingStatus || '未寄出') === '未寄出') {
      unshippedCount += qty;
    }
  });

  const kpiCount = document.getElementById('sale-kpi-count');
  const kpiIncome = document.getElementById('sale-kpi-income');
  const kpiUnpaid = document.getElementById('sale-kpi-unpaid');
  const kpiUnshipped = document.getElementById('sale-kpi-unshipped');

  if (kpiCount) kpiCount.textContent = `${totalItemsCount} 件`;
  if (kpiIncome) kpiIncome.textContent = `NT$ ${totalIncome.toLocaleString()}`;
  if (kpiUnpaid) kpiUnpaid.textContent = `NT$ ${totalUncollected.toLocaleString()}`;
  if (kpiUnshipped) kpiUnshipped.textContent = `${unshippedCount} 件`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-400 text-sm bg-white rounded-xl border border-dashed border-slate-200">
        暫無符合條件的個人出物資料，點擊右上角「+ 新增出物」開始記錄！
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const qty = item.quantity || 1;
    const total = (item.price || 0) * qty;
    const isShipped = (item.shippingStatus || '未寄出') === '寄出';

    let payBadge = '';
    if (item.payStatus === '已全額匯款') {
      payBadge = '<span class="badge bg-emerald-100 text-emerald-800">✓ 已全額匯款</span>';
    } else if (item.payStatus === '訂金') {
      const rem = Math.max(0, total - (item.deposit || 0));
      payBadge = `
        <span class="badge bg-amber-100 text-amber-800">
          訂金 NT$ ${(item.deposit || 0).toLocaleString()} (尾款 NT$ ${rem.toLocaleString()})
        </span>
      `;
    } else if (item.payStatus === '貨到付款') {
      payBadge = '<span class="badge bg-blue-100 text-blue-800">📦 貨到付款</span>';
    } else {
      payBadge = '<span class="badge bg-rose-100 text-rose-700">✕ 未匯款</span>';
    }

    return `
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition">
        <div class="p-4 space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center space-x-3">
              ${item.imageUrl ? `
                <img src="${item.imageUrl}" class="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0" alt="出物商品" onerror="this.remove()">
              ` : `
                <div class="w-14 h-14 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shrink-0">
                  🎁
                </div>
              `}
              <div>
                <h4 class="font-bold text-slate-900 text-base line-clamp-1">${item.name}</h4>
                <div class="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-2">
                  <span class="badge bg-indigo-50 text-indigo-700 font-medium">通路：${item.channel || '賣貨便'}</span>
                  <span>買家：<strong class="text-slate-700">${item.buyer || '未認領'}</strong></span>
                </div>
              </div>
            </div>
            <button data-id="${item.id}" class="btn-toggle-sale-shipping badge cursor-pointer transition ${isShipped ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
              ${isShipped ? '✓ 已寄出' : '⏳ 未寄出'}
            </button>
          </div>

          <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs flex justify-between items-center">
            <div>
              <span class="text-slate-500">單價 NT$ ${(item.price || 0).toLocaleString()} × ${qty} 件</span>
              <div class="text-[11px] text-slate-400 mt-0.5">${item.saleDate ? `出物日期：${item.saleDate}` : ''}</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-bold text-indigo-600">NT$ ${total.toLocaleString()}</div>
              <div class="mt-0.5">${payBadge}</div>
            </div>
          </div>

          ${item.notes ? `
            <div class="text-xs text-slate-500 bg-slate-50/50 p-2 rounded border border-slate-100 truncate">
              📝 ${item.notes}
            </div>
          ` : ''}
        </div>

        <div class="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex justify-end space-x-2">
          <button data-id="${item.id}" class="btn-edit-sale px-2.5 py-1 text-xs text-slate-600 hover:text-indigo-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition">
            編輯
          </button>
          <button data-id="${item.id}" class="btn-delete-sale px-2 py-1 text-xs text-slate-400 hover:text-rose-500 transition">
            刪除
          </button>
        </div>
      </div>
    `;
  }).join('');

  attachSaleEvents();
}

function attachSaleEvents() {
  const container = document.getElementById('sale-items-container');
  if (!container) return;

  container.querySelectorAll('.btn-toggle-sale-shipping').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = (appState.personalSales || []).find(i => i.id === btn.dataset.id);
      if (item) {
        item.shippingStatus = item.shippingStatus === '寄出' ? '未寄出' : '寄出';
        persistData();
      }
    });
  });

  container.querySelectorAll('.btn-edit-sale').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = (appState.personalSales || []).find(i => i.id === btn.dataset.id);
      if (!item) return;

      const modal = document.getElementById('modal-sale');
      const form = document.getElementById('form-sale');
      const editIdInput = document.getElementById('sale-edit-id');
      const modalTitle = document.getElementById('modal-sale-title');
      const imageUrlInput = document.getElementById('sale-image-url');
      const imagePreview = document.getElementById('sale-image-preview');
      const imagePreviewContainer = document.getElementById('sale-image-preview-container');
      const imageFilename = document.getElementById('sale-image-filename');

      if (editIdInput) editIdInput.value = item.id;
      if (modalTitle) modalTitle.textContent = '編輯個人出物';

      form.elements['name'].value = item.name || '';
      form.elements['channel'].value = item.channel || '賣貨便';
      form.elements['price'].value = item.price || 0;
      form.elements['quantity'].value = item.quantity || 1;
      form.elements['buyer'].value = item.buyer || '';
      form.elements['payStatus'].value = item.payStatus || '未匯款';
      form.elements['shippingStatus'].value = item.shippingStatus || '未寄出';
      form.elements['saleDate'].value = item.saleDate || '';
      form.elements['notes'].value = item.notes || '';

      const total = (item.price || 0) * (item.quantity || 1);
      const totalDisplay = document.getElementById('sale-total-display');
      if (totalDisplay) totalDisplay.textContent = `NT$ ${total.toLocaleString()}`;

      const depContainer = document.getElementById('sale-deposit-container');
      const depInput = document.getElementById('sale-deposit');
      const remDisplay = document.getElementById('sale-remaining-display');

      if (item.payStatus === '訂金') {
        depContainer?.classList.remove('hidden');
        if (depInput) depInput.value = item.deposit || 0;
        const rem = Math.max(0, total - (item.deposit || 0));
        if (remDisplay) remDisplay.textContent = `NT$ ${rem.toLocaleString()}`;
      } else {
        depContainer?.classList.add('hidden');
        if (depInput) depInput.value = 0;
      }

      if (imageUrlInput) imageUrlInput.value = item.imageUrl || '';
      if (item.imageUrl && imagePreview && imagePreviewContainer) {
        imagePreview.src = item.imageUrl;
        if (imageFilename) imageFilename.textContent = '已保存圖片';
        imagePreviewContainer.classList.remove('hidden');
        imagePreviewContainer.classList.add('flex');
      } else if (imagePreviewContainer) {
        imagePreviewContainer.classList.add('hidden');
      }

      updateSaleBuyerDatalist();
      modal?.classList.remove('hidden');
      modal?.classList.add('flex');
    });
  });

  container.querySelectorAll('.btn-delete-sale').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('確定刪除此筆個人出物資料嗎？')) {
        appState.personalSales = (appState.personalSales || []).filter(i => i.id !== btn.dataset.id);
        persistData();
      }
    });
  });
}
