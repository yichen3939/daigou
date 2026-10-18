import { appState } from './storage.js';

let channelChartInstance = null;
let financeChartInstance = null;

export function updateDashboard() {
  let personalCost = 0;
  let personalDeposit = 0;
  const channelMap = {};

  appState.personalPurchases.forEach(p => {
    const total = p.price * p.quantity;
    personalCost += total;
    if (p.payMethod === '訂金+尾款') {
      personalDeposit += p.deposit;
    }
    const ch = p.channel || '其他';
    channelMap[ch] = (channelMap[ch] || 0) + total;
  });

  let groupCostTwd = 0;
  let groupCostJpy = 0;
  let totalSplitPrice = 0;
  let firstPaidAmount = 0;
  let secondPendingCount = 0;
  let secondPendingAmount = 0;

  appState.groupOrders.forEach(g => {
    groupCostTwd += g.costTwd;
    groupCostJpy += g.costJpy;
    g.items.forEach(i => {
      totalSplitPrice += i.price;
      if (i.firstPaid) {
        firstPaidAmount += i.price;
      }
      if (i.secondPayStatus === '已通知待付') {
        secondPendingCount += 1;
        secondPendingAmount += i.secondPayAmount;
      }
    });
  });

  const firstUnpaid = totalSplitPrice - firstPaidAmount;

  document.getElementById('kpi-personal-cost').textContent = `NT$ ${personalCost.toLocaleString()}`;
  document.getElementById('kpi-personal-deposit').textContent = `已付訂金：NT$ ${personalDeposit.toLocaleString()}`;
  document.getElementById('kpi-group-cost').textContent = `NT$ ${groupCostTwd.toLocaleString()}`;
  document.getElementById('kpi-group-cost-jpy').textContent = `折合日幣：¥ ${groupCostJpy.toLocaleString()}`;
  document.getElementById('kpi-first-pay-progress').textContent = `NT$ ${firstPaidAmount.toLocaleString()} / ${totalSplitPrice.toLocaleString()}`;
  document.getElementById('kpi-first-pay-unpaid').textContent = `待收一補：NT$ ${firstUnpaid.toLocaleString()}`;
  document.getElementById('kpi-second-pay-amount').textContent = `NT$ ${secondPendingAmount.toLocaleString()}`;
  document.getElementById('kpi-second-pay-count').textContent = `待補款人數：${secondPendingCount} 人`;

  renderCharts(channelMap, groupCostTwd, totalSplitPrice, firstPaidAmount);
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
        labels: ['總成本', '拆團應收總額', '一補實收金額'],
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
