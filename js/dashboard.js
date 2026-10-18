import { appState } from './storage.js';

let channelChartInstance = null;
let financeChartInstance = null;

export function updateDashboard() {
  let personalCost = 0;
  let personalDeposit = 0;
  const channelMap = {};

  (appState.personalPurchases || []).forEach(p => {
    const total = (p.price || 0) * (p.quantity || 1);
    personalCost += total;
    if (p.payMethod === '訂金+尾款') {
      personalDeposit += (p.deposit || 0);
    }
    const ch = p.channel || '其他';
    channelMap[ch] = (channelMap[ch] || 0) + total;
  });

  let groupCostTwd = 0;
  let groupCostJpy = 0;
  let totalSellPrice = 0;
  let totalPaidByBuyers = 0;
  let pendingBuyerAmount = 0;

  (appState.groupOrders || []).forEach(g => {
    let catCostTwd = 0;
    let catCostJpy = 0;

    (g.categories || []).forEach(cat => {
      const catQty = cat.quantity || 1;
      catCostTwd += ((cat.costTwd || 0) * catQty);
      catCostJpy += ((cat.costJpy || 0) * catQty);

      (cat.items || []).forEach(i => {
        const itemQty = i.quantity || 1;
        const itemTotal = (i.price || 0) * itemQty;
        totalSellPrice += itemTotal;
        if (i.payStatus === '已全額匯款') {
          totalPaidByBuyers += itemTotal;
        } else if (i.payStatus === '訂金') {
          const dep = i.deposit || 0;
          totalPaidByBuyers += dep;
          pendingBuyerAmount += Math.max(0, itemTotal - dep);
        } else {
          pendingBuyerAmount += itemTotal;
        }
      });
    });

    groupCostTwd += catCostTwd;
    groupCostJpy += catCostJpy;
  });

  const overallProfit = totalSellPrice - groupCostTwd;

  document.getElementById('kpi-personal-cost').textContent = `NT$ ${personalCost.toLocaleString()}`;
  document.getElementById('kpi-personal-deposit').textContent = `已付訂金：NT$ ${personalDeposit.toLocaleString()}`;
  document.getElementById('kpi-group-cost').textContent = `NT$ ${groupCostTwd.toLocaleString()}`;
  document.getElementById('kpi-group-cost-jpy').textContent = `折合日幣：¥ ${groupCostJpy.toLocaleString()}`;
  document.getElementById('kpi-first-pay-progress').textContent = `NT$ ${totalPaidByBuyers.toLocaleString()} / ${totalSellPrice.toLocaleString()}`;
  document.getElementById('kpi-first-pay-unpaid').textContent = `買家待收尾款/未付：NT$ ${pendingBuyerAmount.toLocaleString()}`;
  document.getElementById('kpi-second-pay-amount').textContent = `NT$ ${Math.abs(overallProfit).toLocaleString()}`;
  document.getElementById('kpi-second-pay-count').textContent = overallProfit >= 0 ? `目前總盈利：+NT$ ${overallProfit.toLocaleString()}` : `待拆團平攤：-NT$ ${Math.abs(overallProfit).toLocaleString()}`;

  renderCharts(channelMap, groupCostTwd, totalSellPrice, totalPaidByBuyers);
}

function renderCharts(channelMap, costTwd, totalSplit, firstPaid) {
  const ctxChannel = document.getElementById('chart-personal-channel')?.getContext('2d');
  if (ctxChannel) {
    if (channelChartInstance) channelChartInstance.destroy();

    const labels = Object.keys(channelMap);
    const data = Object.values(channelMap);

    channelChartInstance = new Chart(ctxChannel, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['暫無資料'],
        datasets: [{
          data: data.length ? data : [1],
          backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#cbd5e1']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  const ctxFinance = document.getElementById('chart-group-finance')?.getContext('2d');
  if (ctxFinance) {
    if (financeChartInstance) financeChartInstance.destroy();

    financeChartInstance = new Chart(ctxFinance, {
      type: 'bar',
      data: {
        labels: ['代購總成本', '我賣的應收總額', '買家實收總額'],
        datasets: [{
          label: '金額 (NT$)',
          data: [costTwd, totalSplit, firstPaid],
          backgroundColor: ['#f43f5e', '#3b82f6', '#10b981'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}
