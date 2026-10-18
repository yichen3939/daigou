import { appState, persistData } from './storage.js';

export function initPersonalModule() {
  const container = document.getElementById('personal-items-container');
  const searchInput = document.getElementById('personal-search');
  const statusFilter = document.getElementById('personal-filter-status');
  const payFilter = document.getElementById('personal-filter-pay');
  const payMethodSelect = document.getElementById('personal-paymethod-select');
  const depositField = document.getElementById('field-deposit-container');
  const form = document.getElementById('form-personal');
  const modal = document.getElementById('modal-personal');
  const btnOpenModal = document.getElementById('btn-open-personal-modal');
  const btnCancel = document.getElementById('btn-cancel-personal');

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

  // Modal 控制
  btnOpenModal.addEventListener('click', () => modal.classList.remove('hidden'));
  btnCancel.addEventListener('click', () => {
    form.reset();
    depositField.classList.add('hidden');
    modal.classList.add('hidden');
  });

  // 表單送出新增
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const price = Number(fd.get('price')) || 0;
    const quantity = Number(fd.get('quantity')) || 1;
    const payMethod = fd.get('payMethod');
    const deposit = payMethod === '訂金+尾款' ? (Number(fd.get('deposit')) || 0) : 0;

    const newItem = {
      id: 'p_' + Date.now(),
      name: fd.get('name'),
      imageUrl: fd.get('imageUrl') || '',
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
    persistData();

    form.reset();
    depositField.classList.add('hidden');
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
  const payVal = document.getElementById('personal-filter-pay').value;

  const filtered = appState.personalPurchases.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(query) || item.channel.toLowerCase().includes(query);
    const matchesStatus = !statusVal || item.status === statusVal;
    const matchesPay = !payVal || item.payMethod === payVal;
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
          <span class="text-slate-400">更新物流進度</span>
          <select data-id="${item.id}" class="select-change-status bg-white border border-slate-200 rounded px-2 py-1 font-medium text-slate-700">
            <option value="已喊單" ${item.status === '已喊單' ? 'selected' : ''}>已喊單</option>
            <option value="賣貨便已下單" ${item.status === '賣貨便已下單' ? 'selected' : ''}>賣貨便已下單</option>
            <option value="已完成" ${item.status === '已完成' ? 'selected' : ''}>已完成</option>
          </select>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-delete-personal').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (confirm('確定刪除此商品嗎？')) {
        appState.personalPurchases = appState.personalPurchases.filter(i => i.id !== id);
        persistData();
      }
    });
  });

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
