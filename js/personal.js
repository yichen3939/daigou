import { appState, persistData } from './storage.js';

// 圖片壓縮輔助函式（將使用者從電腦選取的圖檔等比縮放壓縮成 Base64，避免 LocalStorage / Firebase 超限）
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
      img.onerror = () => reject(new Error('圖片解析失敗'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('讀取檔案失敗'));
    reader.readAsDataURL(file);
  });
}

export function initPersonalModule() {
  const container = document.getElementById('personal-items-container');
  const searchInput = document.getElementById('personal-search');
  const statusFilter = document.getElementById('personal-filter-status');
  const payFilter = document.getElementById('personal-filter-pay');
  const payMethodSelect = document.getElementById('personal-paymethod-select');
  const depositField = document.getElementById('field-deposit-container');
  const form = document.getElementById('form-personal');
  const modal = document.getElementById('modal-personal');
  const modalTitle = document.getElementById('modal-personal-title');
  const editIdInput = document.getElementById('personal-edit-id');
  const btnOpenModal = document.getElementById('btn-open-personal-modal');
  const btnCancel = document.getElementById('btn-cancel-personal');

  // 圖片上傳與預覽元素
  const imageUrlInput = document.getElementById('personal-image-url');
  const imageFileInput = document.getElementById('personal-image-file');
  const previewContainer = document.getElementById('personal-image-preview-container');
  const previewImg = document.getElementById('personal-image-preview');
  const btnRemoveImage = document.getElementById('btn-remove-personal-image');

  function updateImagePreview(src) {
    if (src) {
      previewImg.src = src;
      previewContainer.classList.remove('hidden');
    } else {
      previewImg.src = '';
      previewContainer.classList.add('hidden');
    }
  }

  // 監聽電腦本機圖片上傳
  if (imageFileInput) {
    imageFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const compressedBase64 = await compressImageFile(file);
        imageUrlInput.value = compressedBase64;
        updateImagePreview(compressedBase64);
      } catch (err) {
        alert('圖片讀取失敗，請重試');
      }
    });
  }

  // 監聽圖片網址手動輸入
  if (imageUrlInput) {
    imageUrlInput.addEventListener('input', (e) => {
      updateImagePreview(e.target.value.trim());
    });
  }

  // 移除圖片
  if (btnRemoveImage) {
    btnRemoveImage.addEventListener('click', () => {
      if (imageUrlInput) imageUrlInput.value = '';
      if (imageFileInput) imageFileInput.value = '';
      updateImagePreview('');
    });
  }

  // 動態切換訂金輸入框
  payMethodSelect.addEventListener('change', (e) => {
    if (e.target.value === '訂金+尾款') {
      depositField.classList.remove('hidden');
      depositField.querySelector('input').required = true;
    } else {
      depositField.classList.add('hidden');
      depositField.querySelector('input').required = false;
      depositField.querySelector('input').value = 0;
    }
  });

  // Modal 控制 - 打開新增
  btnOpenModal.addEventListener('click', () => {
    form.reset();
    if (editIdInput) editIdInput.value = '';
    if (modalTitle) modalTitle.textContent = '新增個人自購商品';
    depositField.classList.add('hidden');
    updateImagePreview('');
    if (imageFileInput) imageFileInput.value = '';
    modal.classList.remove('hidden');
  });

  // Modal 控制 - 取消關閉
  btnCancel.addEventListener('click', () => {
    form.reset();
    if (editIdInput) editIdInput.value = '';
    depositField.classList.add('hidden');
    updateImagePreview('');
    if (imageFileInput) imageFileInput.value = '';
    modal.classList.add('hidden');
  });

  // 表單送出（新增 / 編輯儲存）
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const editId = editIdInput ? editIdInput.value : '';
    const price = Number(fd.get('price')) || 0;
    const quantity = Number(fd.get('quantity')) || 1;
    const payMethod = fd.get('payMethod');
    const deposit = payMethod === '訂金+尾款' ? (Number(fd.get('deposit')) || 0) : 0;
    const imageUrl = imageUrlInput ? imageUrlInput.value.trim() : (fd.get('imageUrl') || '');

    if (editId) {
      // 編輯更新既有項目
      const target = appState.personalPurchases.find(i => i.id === editId);
      if (target) {
        target.name = fd.get('name');
        target.imageUrl = imageUrl;
        target.quantity = quantity;
        target.price = price;
        target.channel = fd.get('channel') || '無';
        target.payMethod = payMethod;
        target.deposit = deposit;
        target.orderDate = fd.get('orderDate') || '';
        target.arrivalMonth = fd.get('arrivalMonth') || '';
        target.status = fd.get('status') || '已喊單';
        target.notes = fd.get('notes') || '';
      }
    } else {
      // 新增項目
      const newItem = {
        id: 'p_' + Date.now(),
        name: fd.get('name'),
        imageUrl,
        quantity,
        price,
        channel: fd.get('channel') || '無',
        payMethod,
        deposit,
        orderDate: fd.get('orderDate') || '',
        arrivalMonth: fd.get('arrivalMonth') || '',
        status: fd.get('status') || '已喊單',
        notes: fd.get('notes') || ''
      };
      appState.personalPurchases.unshift(newItem);
    }

    persistData();

    form.reset();
    if (editIdInput) editIdInput.value = '';
    depositField.classList.add('hidden');
    updateImagePreview('');
    if (imageFileInput) imageFileInput.value = '';
    modal.classList.add('hidden');
  });

  // 篩選監聽
  searchInput.addEventListener('input', () => renderPersonalList());
  statusFilter.addEventListener('change', () => renderPersonalList());
  payFilter.addEventListener('change', () => renderPersonalList());
}

export function renderPersonalList() {
  const container = document.getElementById('personal-items-container');
  const query = document.getElementById('personal-search').value.trim().toLowerCase();
  const statusVal = document.getElementById('personal-filter-status').value;
  const payVal = document.getElementById('personal-filter-pay');
  const payFilterVal = payVal ? payVal.value : '';

  const filtered = appState.personalPurchases.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(query) || item.channel.toLowerCase().includes(query);
    const matchesStatus = !statusVal || item.status === statusVal;
    const matchesPay = !payFilterVal || item.payMethod === payFilterVal;
    return matchesSearch && matchesStatus && matchesPay;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400 text-sm">暫無自購商品資料</div>`;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const totalPrice = item.price * item.quantity;
    const remainingBalance = item.payMethod === '訂金+尾款' ? Math.max(0, totalPrice - item.deposit) : 0;

    return `
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
        <div>
          ${item.imageUrl ? `<img src="${item.imageUrl}" class="w-full h-44 object-cover" alt="商品圖片" onerror="this.remove()">` : ''}
          <div class="p-4 space-y-3">
            <div class="flex justify-between items-start gap-2">
              <h3 class="font-bold text-slate-800 text-base leading-snug">${item.name}</h3>
              <button data-id="${item.id}" class="btn-delete-personal text-slate-300 hover:text-rose-500 transition text-sm">✕</button>
            </div>
            
            <div class="flex flex-wrap gap-1.5">
              <span class="badge bg-slate-100 text-slate-600">${item.channel}</span>
              <span class="badge bg-indigo-50 text-indigo-700">${item.payMethod}</span>
              <span class="badge ${getStatusBadgeClass(item.status)}">${item.status}</span>
            </div>

            <div class="text-xs space-y-1 text-slate-500 pt-2 border-t border-slate-100">
              <div class="flex justify-between">
                <span>單價 × 數量</span>
                <span class="font-medium text-slate-700">NT$ ${item.price} × ${item.quantity}</span>
              </div>
              <div class="flex justify-between text-sm font-bold text-slate-900">
                <span>總價</span>
                <span>NT$ ${totalPrice.toLocaleString()}</span>
              </div>
              ${item.payMethod === '訂金+尾款' ? `
                <div class="flex justify-between text-amber-600 font-medium">
                  <span>已付訂金</span>
                  <span>NT$ ${item.deposit.toLocaleString()}</span>
                </div>
                <div class="flex justify-between text-rose-500 font-bold">
                  <span>剩餘尾款</span>
                  <span>NT$ ${remainingBalance.toLocaleString()}</span>
                </div>
              ` : ''}
              <div class="flex justify-between pt-1">
                <span>下單 / 抵台</span>
                <span>${item.orderDate || '--'} / ${item.arrivalMonth || '--'}</span>
              </div>
              ${item.notes ? `<div class="pt-1 text-slate-400 truncate">備註：${item.notes}</div>` : ''}
            </div>
          </div>
        </div>

        <div class="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
          <div class="flex items-center space-x-2">
            <span class="text-slate-400">更新物流進度</span>
            <select data-id="${item.id}" class="select-change-status bg-white border border-slate-200 rounded px-2 py-1 font-medium text-slate-700">
              <option value="已喊單" ${item.status === '已喊單' ? 'selected' : ''}>已喊單</option>
              <option value="賣貨便已下單" ${item.status === '賣貨便已下單' ? 'selected' : ''}>賣貨便已下單</option>
              <option value="已完成" ${item.status === '已完成' ? 'selected' : ''}>已完成</option>
            </select>
          </div>
          <button data-id="${item.id}" class="btn-edit-personal px-3 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 hover:border-indigo-300 rounded shadow-sm transition">
            編輯
          </button>
        </div>
      </div>
    `;
  }).join('');

  // 刪除按鈕
  container.querySelectorAll('.btn-delete-personal').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (confirm('確定刪除此商品嗎？')) {
        appState.personalPurchases = appState.personalPurchases.filter(i => i.id !== id);
        persistData();
      }
    });
  });

  // 編輯按鈕
  container.querySelectorAll('.btn-edit-personal').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = appState.personalPurchases.find(i => i.id === id);
      if (!item) return;

      const modal = document.getElementById('modal-personal');
      const form = document.getElementById('form-personal');
      const modalTitle = document.getElementById('modal-personal-title');
      const editIdInput = document.getElementById('personal-edit-id');
      const depositField = document.getElementById('field-deposit-container');
      const imageUrlInput = document.getElementById('personal-image-url');
      const previewContainer = document.getElementById('personal-image-preview-container');
      const previewImg = document.getElementById('personal-image-preview');

      if (editIdInput) editIdInput.value = item.id;
      if (modalTitle) modalTitle.textContent = '編輯個人自購商品';

      form.elements['name'].value = item.name || '';
      if (imageUrlInput) imageUrlInput.value = item.imageUrl || '';
      if (item.imageUrl && previewContainer && previewImg) {
        previewImg.src = item.imageUrl;
        previewContainer.classList.remove('hidden');
      } else if (previewContainer) {
        previewContainer.classList.add('hidden');
      }

      form.elements['quantity'].value = item.quantity || 1;
      form.elements['price'].value = item.price || 0;
      form.elements['channel'].value = item.channel || '';
      form.elements['payMethod'].value = item.payMethod || '取貨付款';
      form.elements['orderDate'].value = item.orderDate || '';
      form.elements['arrivalMonth'].value = item.arrivalMonth || '';
      form.elements['status'].value = item.status || '已喊單';
      form.elements['notes'].value = item.notes || '';

      if (item.payMethod === '訂金+尾款') {
        depositField.classList.remove('hidden');
        depositField.querySelector('input').required = true;
        depositField.querySelector('input').value = item.deposit || 0;
      } else {
        depositField.classList.add('hidden');
        depositField.querySelector('input').required = false;
        depositField.querySelector('input').value = 0;
      }

      modal.classList.remove('hidden');
    });
  });

  // 更新物流進度下拉選單
  container.querySelectorAll('.select-change-status').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const id = sel.dataset.id;
      const target = appState.personalPurchases.find(i => i.id === id);
      if (target) {
        target.status = e.target.value;
        persistData();
      }
    });
  });
}

function getStatusBadgeClass(status) {
  switch (status) {
    case '已喊單': return 'bg-amber-50 text-amber-700';
    case '賣貨便已下單': return 'bg-blue-50 text-blue-700';
    case '已完成': return 'bg-emerald-50 text-emerald-700';
    default: return 'bg-slate-100 text-slate-600';
  }
}
