import { appState, persistData } from './storage.js';

export function initBuyerModule() {
  const searchInput = document.getElementById('buyer-search-input');
  const payFilter = document.getElementById('buyer-filter-pay');
  const shippingFilter = document.getElementById('buyer-filter-shipping');
  const btnSearch = document.getElementById('btn-search-buyer');
  const btnClear = document.getElementById('btn-clear-buyer');
  const btnCopySummary = document.getElementById('btn-copy-buyer-summary');

  // 多事件監聽，確保在任何裝置、瀏覽器、Datalist 選取或剪貼簿貼上時都能 100% 觸發查詢
  ['input', 'change', 'keyup', 'paste', 'search'].forEach(evt => {
    searchInput?.addEventListener(evt, () => renderBuyerList());
  });

  payFilter?.addEventListener('change', () => renderBuyerList());
  shippingFilter?.addEventListener('change', () => renderBuyerList());

  btnSearch?.addEventListener('click', () => renderBuyerList());

  btnClear?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (payFilter) payFilter.value = '';
    if (shippingFilter) shippingFilter.value = '';
    renderBuyerList();
  });

  btnCopySummary?.addEventListener('click', () => {
    copyBuyerSummaryText();
  });

  updateBuyerLookupDatalist();
}

// 搜集所有買家（揪團認領 + 個人出物）填入 Datalist
export function updateBuyerLookupDatalist() {
  const datalist = document.getElementById('buyer-lookup-datalist');
  if (!datalist) return;
  const buyers = new Set();
  (appState.groupOrders || []).forEach(g => {
    const categories = getGroupCategories(g);
    categories.forEach(c => {
      (c.items || []).forEach(i => {
        const b = (i.buyer || '').trim();
        if (b && b !== '未認領') {
          buyers.add(b);
        }
      });
    });
  });
  (appState.personalSales || []).forEach(s => {
    const b = (s.buyer || '').trim();
    if (b && b !== '未認領') {
      buyers.add(b);
    }
  });
  datalist.innerHTML = Array.from(buyers).sort().map(b => `<option value="${b}">`).join('');
}

// 確保舊版與新版資料結構相容
function getGroupCategories(group) {
  if (group.categories && group.categories.length > 0) {
    return group.categories;
  }
  if (group.items && group.items.length > 0) {
    return [{
      id: 'cat_legacy_' + group.id,
      name: group.category || '預設類別',
      items: group.items
    }];
  }
  return [];
}

export function renderBuyerList() {
  const container = document.getElementById('buyer-items-container');
  const summaryCards = document.getElementById('buyer-summary-cards');
  if (!container) return;

  updateBuyerLookupDatalist();

  const query = (document.getElementById('buyer-search-input')?.value || '').trim().toLowerCase();
  const payFilterVal = document.getElementById('buyer-filter-pay')?.value || '';
  const shippingFilterVal = document.getElementById('buyer-filter-shipping')?.value || '';

  // 搜集符合條件的所有商品項目
  const results = [];

  // 1. 揪團認領品項
  (appState.groupOrders || []).forEach(g => {
    const categories = getGroupCategories(g);
    categories.forEach(c => {
      (c.items || []).forEach(i => {
        const buyerName = (i.buyer || '').trim();
        if (!buyerName || buyerName === '未認領') return;

        if (query && !buyerName.toLowerCase().includes(query)) {
          return;
        }

        const qty = i.quantity || 1;
        const unitPrice = i.price || 0;
        const totalPrice = unitPrice * qty;
        const payStatus = i.payStatus || (i.firstPaid ? '已全額匯款' : '未匯款');
        const deposit = payStatus === '訂金' ? (i.deposit || 0) : 0;
        const remaining = Math.max(0, totalPrice - deposit);
        const isPaid = payStatus === '已全額匯款';
        const isUnpaid = payStatus === '未匯款' || (payStatus === '訂金' && remaining > 0) || payStatus === '貨到付款';
        const shippingStatus = i.shippingStatus || '未寄出';

        if (payFilterVal === 'paid' && !isPaid) return;
        if (payFilterVal === 'unpaid' && !isUnpaid) return;
        if (shippingFilterVal && shippingStatus !== shippingFilterVal) return;

        results.push({
          sourceType: 'group',
          sourceName: g.name,
          categoryName: c.name,
          imageUrl: g.imageUrl,
          itemId: i.id,
          groupId: g.id,
          categoryId: c.id,
          name: i.characterName,
          buyerName,
          qty,
          unitPrice,
          totalPrice,
          payStatus,
          deposit,
          remaining,
          shippingStatus,
          buyerNote: i.buyerNote || ''
        });
      });
    });
  });

  // 2. 個人出物品項
  (appState.personalSales || []).forEach(s => {
    const buyerName = (s.buyer || '').trim();
    if (!buyerName || buyerName === '未認領') return;

    if (query && !buyerName.toLowerCase().includes(query)) {
      return;
    }

    const qty = s.quantity || 1;
    const unitPrice = s.price || 0;
    const totalPrice = unitPrice * qty;
    const payStatus = s.payStatus || '未匯款';
    const deposit = payStatus === '訂金' ? (s.deposit || 0) : 0;
    const remaining = Math.max(0, totalPrice - deposit);
    const isPaid = payStatus === '已全額匯款';
    const isUnpaid = payStatus === '未匯款' || (payStatus === '訂金' && remaining > 0) || payStatus === '貨到付款';
    const shippingStatus = s.shippingStatus || '未寄出';

    if (payFilterVal === 'paid' && !isPaid) return;
    if (payFilterVal === 'unpaid' && !isUnpaid) return;
    if (shippingFilterVal && shippingStatus !== shippingFilterVal) return;

    results.push({
      sourceType: 'sale',
      sourceName: `個人出物 (${s.channel || '賣貨便'})`,
      categoryName: '出物',
      imageUrl: s.imageUrl,
      itemId: s.id,
      groupId: '',
      categoryId: '',
      name: s.name,
      buyerName,
      qty,
      unitPrice,
      totalPrice,
      payStatus,
      deposit,
      remaining,
      shippingStatus,
      buyerNote: s.notes || ''
    });
  });

  if (!query && !payFilterVal && !shippingFilterVal) {
    summaryCards?.classList.add('hidden');
    container.innerHTML = `
      <div class="p-12 text-center text-slate-400 text-sm space-y-2">
        <div class="text-2xl">🔍</div>
        <div>請於上方「輸入或選擇買家名稱」查看該買家的所有商品</div>
        <div class="text-xs text-slate-400">（也可直接點選上方「只顯示未付款」或「只顯示未寄出」查看全團清單）</div>
      </div>
    `;
    return;
  }

  if (results.length === 0) {
    summaryCards?.classList.add('hidden');
    container.innerHTML = `
      <div class="p-12 text-center text-slate-400 text-sm space-y-2">
        <div class="text-2xl">📭</div>
        <div class="font-medium text-slate-600">查無符合條件的商品明細</div>
        <div class="text-xs text-slate-400">買家帳號「${query || '全部'}」目前沒有符合指定條件（${payFilterVal ? (payFilterVal === 'paid' ? '已付款' : '未付款') : '全部付款'} / ${shippingFilterVal || '全部寄送'}）的項目</div>
      </div>
    `;
    return;
  }

  // 計算 Summary 統計值
  let totalCount = 0;
  let totalCost = 0;
  let totalUnpaid = 0;
  let unshippedCount = 0;

  results.forEach(r => {
    totalCount += r.qty;
    totalCost += r.totalPrice;
    if (r.payStatus === '未匯款' || r.payStatus === '貨到付款') {
      totalUnpaid += r.totalPrice;
    } else if (r.payStatus === '訂金') {
      totalUnpaid += r.remaining;
    }
    if (r.shippingStatus === '未寄出') {
      unshippedCount += r.qty;
    }
  });

  if (summaryCards) {
    summaryCards.classList.remove('hidden');
    document.getElementById('buyer-stat-count').textContent = `${totalCount} 件`;
    document.getElementById('buyer-stat-total').textContent = `NT$ ${totalCost.toLocaleString()}`;
    document.getElementById('buyer-stat-unpaid').textContent = `NT$ ${totalUnpaid.toLocaleString()}`;
    document.getElementById('buyer-stat-unshipped').textContent = `${unshippedCount} 件`;
  }

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
          <tr>
            <th class="py-3 px-4">來源 / 主團</th>
            <th class="py-3 px-4">類別</th>
            <th class="py-3 px-4">商品 / 角色</th>
            <th class="py-3 px-4">買家帳號</th>
            <th class="py-3 px-4">數量</th>
            <th class="py-3 px-4">單價</th>
            <th class="py-3 px-4">總金額</th>
            <th class="py-3 px-4">付款狀態</th>
            <th class="py-3 px-4">寄送狀態 (可點擊切換)</th>
            <th class="py-3 px-4">備註說明</th>
            <th class="py-3 px-4 text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${results.map(r => {
            let payBadge = '';
            if (r.payStatus === '已全額匯款') {
              payBadge = '<span class="badge bg-emerald-100 text-emerald-800">✓ 已全額匯款</span>';
            } else if (r.payStatus === '訂金') {
              payBadge = `
                <div>
                  <span class="badge bg-amber-100 text-amber-800">已收訂金 NT$ ${(r.deposit || 0).toLocaleString()}</span>
                  <div class="text-[11px] text-rose-500 font-medium mt-0.5">待補尾款：NT$ ${r.remaining.toLocaleString()}</div>
                </div>
              `;
            } else if (r.payStatus === '貨到付款') {
              payBadge = '<span class="badge bg-blue-100 text-blue-800">📦 貨到付款</span>';
            } else {
              payBadge = '<span class="badge bg-rose-100 text-rose-700">✕ 未匯款</span>';
            }

            const isShipped = r.shippingStatus === '寄出';

            return `
              <tr class="hover:bg-slate-50/50 transition">
                <td class="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                  ${r.imageUrl ? `<img src="${r.imageUrl}" class="w-8 h-8 object-cover rounded border border-slate-200 shrink-0" alt="">` : ''}
                  <span>${r.sourceName}</span>
                </td>
                <td class="py-3 px-4 text-slate-600 font-medium">${r.categoryName}</td>
                <td class="py-3 px-4 font-bold text-indigo-700 text-sm">${r.name}</td>
                <td class="py-3 px-4 text-slate-700 font-semibold">${r.buyerName}</td>
                <td class="py-3 px-4 text-slate-700 font-semibold">× ${r.qty}</td>
                <td class="py-3 px-4 text-slate-600">NT$ ${r.unitPrice.toLocaleString()}</td>
                <td class="py-3 px-4 font-bold text-slate-900">NT$ ${r.totalPrice.toLocaleString()}</td>
                <td class="py-3 px-4">${payBadge}</td>
                <td class="py-3 px-4">
                  <button data-type="${r.sourceType}" data-gid="${r.groupId}" data-cid="${r.categoryId}" data-sid="${r.itemId}" class="btn-toggle-buyer-shipping badge cursor-pointer transition ${isShipped ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                    ${isShipped ? '✓ 已寄出' : '⏳ 未寄出'}
                  </button>
                </td>
                <td class="py-3 px-4 text-slate-400 max-w-[150px] truncate">${r.buyerNote || '--'}</td>
                <td class="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                  <button data-type="${r.sourceType}" data-gid="${r.groupId}" data-cid="${r.categoryId}" data-sid="${r.itemId}" class="btn-edit-buyer-item px-2.5 py-1 text-xs text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 hover:border-indigo-300 rounded shadow-sm transition">
                    編輯
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot class="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
          <tr>
            <td colspan="4" class="py-3 px-4">${query ? `買家「${query}」` : '當前篩選'} 商品總計</td>
            <td class="py-3 px-4 text-indigo-600">共 ${totalCount} 件</td>
            <td class="py-3 px-4">--</td>
            <td class="py-3 px-4 text-indigo-700">NT$ ${totalCost.toLocaleString()}</td>
            <td class="py-3 px-4 text-rose-600 text-xs font-semibold">待付總計：NT$ ${totalUnpaid.toLocaleString()}</td>
            <td colspan="3" class="py-3 px-4 text-slate-500 font-normal">
              ${unshippedCount > 0 ? `<span class="text-amber-600 font-medium">尚有 ${unshippedCount} 件未寄出</span>` : `<span class="text-emerald-600 font-medium">✓ 已全數寄出</span>`}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  // 切換寄送狀態
  container.querySelectorAll('.btn-toggle-buyer-shipping').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const sid = btn.dataset.sid;
      if (type === 'sale') {
        const item = (appState.personalSales || []).find(i => i.id === sid);
        if (item) {
          item.shippingStatus = item.shippingStatus === '寄出' ? '未寄出' : '寄出';
          persistData();
        }
      } else {
        const g = (appState.groupOrders || []).find(item => item.id === btn.dataset.gid);
        const cat = g?.categories?.find(c => c.id === btn.dataset.cid);
        const item = cat?.items?.find(i => i.id === sid);
        if (item) {
          item.shippingStatus = item.shippingStatus === '寄出' ? '未寄出' : '寄出';
          persistData();
        }
      }
    });
  });

  // 編輯按鈕
  container.querySelectorAll('.btn-edit-buyer-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const sid = btn.dataset.sid;
      if (type === 'sale') {
        const item = (appState.personalSales || []).find(i => i.id === sid);
        if (!item) return;
        const modal = document.getElementById('modal-sale');
        const form = document.getElementById('form-sale');
        document.getElementById('sale-edit-id').value = item.id;
        document.getElementById('modal-sale-title').textContent = '編輯個人出物';

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
        document.getElementById('sale-total-display').textContent = `NT$ ${total.toLocaleString()}`;

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

        modal?.classList.remove('hidden');
      } else {
        const gid = btn.dataset.gid;
        const cid = btn.dataset.cid;
        openSubitemEditModal(gid, cid, sid);
      }
    });
  });
}

function openSubitemEditModal(gid, cid, sid) {
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
  if (title) title.textContent = `編輯認領商品 (${group.name} - ${cat.name})`;

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

  updateBuyerLookupDatalist();
  document.getElementById('modal-subitem')?.classList.remove('hidden');
}

function copyBuyerSummaryText() {
  const query = (document.getElementById('buyer-search-input')?.value || '').trim();
  if (!query) {
    alert('請先輸入買家名稱！');
    return;
  }

  const items = [];
  let totalCost = 0;
  let totalUnpaid = 0;

  // 揪團
  (appState.groupOrders || []).forEach(g => {
    const categories = getGroupCategories(g);
    categories.forEach(c => {
      (c.items || []).forEach(i => {
        const b = (i.buyer || '').trim();
        if (b && b.toLowerCase().includes(query.toLowerCase())) {
          const qty = i.quantity || 1;
          const price = i.price || 0;
          const total = price * qty;
          const deposit = i.payStatus === '訂金' ? (i.deposit || 0) : 0;
          const remaining = Math.max(0, total - deposit);
          totalCost += total;
          if (i.payStatus === '未匯款' || i.payStatus === '貨到付款') totalUnpaid += total;
          else if (i.payStatus === '訂金') totalUnpaid += remaining;

          items.push(`• 【揪團：${g.name} - ${c.name}】${i.characterName} × ${qty} (NT$ ${total}) [${i.payStatus || '未匯款'}${i.payStatus === '訂金' ? ` 已付${deposit}/尾款${remaining}` : ''}] [${i.shippingStatus || '未寄出'}]`);
        }
      });
    });
  });

  // 出物
  (appState.personalSales || []).forEach(s => {
    const b = (s.buyer || '').trim();
    if (b && b.toLowerCase().includes(query.toLowerCase())) {
      const qty = s.quantity || 1;
      const price = s.price || 0;
      const total = price * qty;
      const deposit = s.payStatus === '訂金' ? (s.deposit || 0) : 0;
      const remaining = Math.max(0, total - deposit);
      totalCost += total;
      if (s.payStatus === '未匯款' || s.payStatus === '貨到付款') totalUnpaid += total;
      else if (s.payStatus === '訂金') totalUnpaid += remaining;

      items.push(`• 【出物：${s.channel || '賣貨便'}】${s.name} × ${qty} (NT$ ${total}) [${s.payStatus || '未匯款'}${s.payStatus === '訂金' ? ` 已付${deposit}/尾款${remaining}` : ''}] [${s.shippingStatus || '未寄出'}]`);
    }
  });

  if (items.length === 0) {
    alert('找不到該買家的任何訂單資料！');
    return;
  }

  const text = `📦 【${query} 周邊訂單對帳明細】\n\n${items.join('\n')}\n\n-------------------\n訂單總金額：NT$ ${totalCost.toLocaleString()}\n待補款/未付款總計：NT$ ${totalUnpaid.toLocaleString()}`;

  navigator.clipboard.writeText(text).then(() => {
    alert('已成功複製買家對帳文字！可直接貼給買家確認。');
  }).catch(() => {
    prompt('請複製以下對帳文字：', text);
  });
}
