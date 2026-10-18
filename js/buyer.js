import { appState, persistData } from './storage.js';

export function initBuyerModule() {
  const searchInput = document.getElementById('buyer-search-input');
  const payFilter = document.getElementById('buyer-filter-pay');
  const shippingFilter = document.getElementById('buyer-filter-shipping');
  const btnCopySummary = document.getElementById('btn-copy-buyer-summary');

  searchInput?.addEventListener('input', () => renderBuyerList());
  payFilter?.addEventListener('change', () => renderBuyerList());
  shippingFilter?.addEventListener('change', () => renderBuyerList());

  btnCopySummary?.addEventListener('click', () => {
    copyBuyerSummaryText();
  });

  updateBuyerLookupDatalist();
}

// 搜集所有買家填入 Datalist
export function updateBuyerLookupDatalist() {
  const datalist = document.getElementById('buyer-lookup-datalist');
  if (!datalist) return;
  const buyers = new Set();
  (appState.groupOrders || []).forEach(g => {
    (g.categories || []).forEach(c => {
      (c.items || []).forEach(i => {
        const b = (i.buyer || '').trim();
        if (b && b !== '未認領') {
          buyers.add(b);
        }
      });
    });
  });
  datalist.innerHTML = Array.from(buyers).sort().map(b => `<option value="${b}">`).join('');
}

export function renderBuyerList() {
  const container = document.getElementById('buyer-items-container');
  const summaryCards = document.getElementById('buyer-summary-cards');
  if (!container) return;

  updateBuyerLookupDatalist();

  const query = (document.getElementById('buyer-search-input')?.value || '').trim().toLowerCase();
  const payFilterVal = document.getElementById('buyer-filter-pay')?.value || '';
  const shippingFilterVal = document.getElementById('buyer-filter-shipping')?.value || '';

  if (!query) {
    summaryCards?.classList.add('hidden');
    container.innerHTML = `
      <div class="p-12 text-center text-slate-400 text-sm">
        請於上方輸入或選擇買家名稱以查看購買商品
      </div>
    `;
    return;
  }

  // 搜集符合該買家的所有商品項目
  const results = [];

  (appState.groupOrders || []).forEach(g => {
    (g.categories || []).forEach(c => {
      (c.items || []).forEach(i => {
        const buyerName = (i.buyer || '').trim();
        if (!buyerName || buyerName === '未認領') return;

        // 買家名稱比對 (支援模糊搜尋或完全匹配)
        if (buyerName.toLowerCase().includes(query)) {
          const qty = i.quantity || 1;
          const unitPrice = i.price || 0;
          const totalPrice = unitPrice * qty;
          const deposit = i.payStatus === '訂金' ? (i.deposit || 0) : 0;
          const remaining = Math.max(0, totalPrice - deposit);
          const isPaid = i.payStatus === '已全額匯款';
          const isUnpaid = i.payStatus === '未匯款' || (i.payStatus === '訂金' && remaining > 0);
          const shippingStatus = i.shippingStatus || '未寄出';

          // 付款狀態篩選
          if (payFilterVal === 'paid' && !isPaid) return;
          if (payFilterVal === 'unpaid' && !isUnpaid) return;

          // 寄送狀態篩選
          if (shippingFilterVal && shippingStatus !== shippingFilterVal) return;

          results.push({
            group: g,
            category: c,
            item: i,
            buyerName,
            qty,
            unitPrice,
            totalPrice,
            deposit,
            remaining,
            isPaid,
            shippingStatus
          });
        }
      });
    });
  });

  if (results.length === 0) {
    summaryCards?.classList.add('hidden');
    container.innerHTML = `
      <div class="p-12 text-center text-slate-400 text-sm">
        找不到符合條件的買家認領商品明細
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
    if (r.item.payStatus === '未匯款') {
      totalUnpaid += r.totalPrice;
    } else if (r.item.payStatus === '訂金') {
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

  // 渲染買家認領表格
  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
          <tr>
            <th class="py-3 px-4">主團名稱</th>
            <th class="py-3 px-4">類別</th>
            <th class="py-3 px-4">角色 / 款式</th>
            <th class="py-3 px-4">買家帳號</th>
            <th class="py-3 px-4">數量</th>
            <th class="py-3 px-4">單價</th>
            <th class="py-3 px-4">總金額</th>
            <th class="py-3 px-4">付款狀態</th>
            <th class="py-3 px-4">寄送狀態</th>
            <th class="py-3 px-4">備註說明</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${results.map(r => {
            let payBadge = '';
            if (r.item.payStatus === '已全額匯款') {
              payBadge = '<span class="badge bg-emerald-100 text-emerald-800">✓ 已全額匯款</span>';
            } else if (r.item.payStatus === '訂金') {
              payBadge = `
                <div>
                  <span class="badge bg-amber-100 text-amber-800">已收訂金 NT$ ${(r.deposit || 0).toLocaleString()}</span>
                  <div class="text-[11px] text-rose-500 font-medium mt-0.5">待補尾款：NT$ ${r.remaining.toLocaleString()}</div>
                </div>
              `;
            } else {
              payBadge = '<span class="badge bg-rose-100 text-rose-700">✕ 未匯款 (NT$ ' + r.totalPrice.toLocaleString() + ')</span>';
            }

            const isShipped = r.shippingStatus === '寄出';

            return `
              <tr class="hover:bg-slate-50/50 transition">
                <td class="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                  ${r.group.imageUrl ? `<img src="${r.group.imageUrl}" class="w-8 h-8 object-cover rounded border border-slate-200 shrink-0" alt="">` : ''}
                  <span>${r.group.name}</span>
                </td>
                <td class="py-3 px-4 text-slate-600 font-medium">${r.category.name}</td>
                <td class="py-3 px-4 font-bold text-indigo-700">${r.item.characterName}</td>
                <td class="py-3 px-4 text-slate-700 font-semibold">${r.buyerName}</td>
                <td class="py-3 px-4 text-slate-700 font-semibold">× ${r.qty}</td>
                <td class="py-3 px-4 text-slate-600">NT$ ${r.unitPrice.toLocaleString()}</td>
                <td class="py-3 px-4 font-bold text-slate-900">NT$ ${r.totalPrice.toLocaleString()}</td>
                <td class="py-3 px-4">${payBadge}</td>
                <td class="py-3 px-4">
                  <span class="badge ${isShipped ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}">
                    ${isShipped ? '✓ 已寄出' : '⏳ 未寄出'}
                  </span>
                </td>
                <td class="py-3 px-4 text-slate-400 max-w-[150px] truncate">${r.item.buyerNote || '--'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot class="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
          <tr>
            <td colspan="4" class="py-3 px-4">買家商品總計</td>
            <td class="py-3 px-4 text-indigo-600">共 ${totalCount} 件</td>
            <td class="py-3 px-4">--</td>
            <td class="py-3 px-4 text-indigo-700">NT$ ${totalCost.toLocaleString()}</td>
            <td class="py-3 px-4 text-rose-600 text-xs font-semibold">待付總計：NT$ ${totalUnpaid.toLocaleString()}</td>
            <td colspan="2" class="py-3 px-4 text-slate-500 font-normal">
              ${unshippedCount > 0 ? `<span class="text-amber-600 font-medium">尚有 ${unshippedCount} 件未寄出</span>` : `<span class="text-emerald-600 font-medium">✓ 已全數寄出</span>`}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}

// 一鍵複製給買家的對帳純文字
function copyBuyerSummaryText() {
  const query = (document.getElementById('buyer-search-input')?.value || '').trim();
  if (!query) {
    alert('請先輸入買家名稱！');
    return;
  }

  const items = [];
  let totalCost = 0;
  let totalUnpaid = 0;

  (appState.groupOrders || []).forEach(g => {
    (g.categories || []).forEach(c => {
      (c.items || []).forEach(i => {
        const b = (i.buyer || '').trim();
        if (b && b.toLowerCase().includes(query.toLowerCase())) {
          const qty = i.quantity || 1;
          const price = i.price || 0;
          const total = price * qty;
          const deposit = i.payStatus === '訂金' ? (i.deposit || 0) : 0;
          const remaining = Math.max(0, total - deposit);
          totalCost += total;
          if (i.payStatus === '未匯款') totalUnpaid += total;
          else if (i.payStatus === '訂金') totalUnpaid += remaining;

          items.push(`• 【${g.name} - ${c.name}】${i.characterName} × ${qty} (NT$ ${total}) [${i.payStatus}${i.payStatus === '訂金' ? ` 已付${deposit}/剩餘${remaining}` : ''}] [${i.shippingStatus || '未寄出'}]`);
        }
      });
    });
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
