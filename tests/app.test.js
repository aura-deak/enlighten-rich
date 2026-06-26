const DataManager = require('../data.js');
const App = require('../app.js');

global.echarts = {
  init: jest.fn(() => ({
    setOption: jest.fn(),
    resize: jest.fn(),
    dispose: jest.fn()
  }))
};

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    DataManager.init();
    
    document.body.innerHTML = `
      <span id="currentMonth"></span>
      <div id="calendarBody"></div>
      <div id="totalBalance"></div>
      <div id="calendarSection"></div>
      <div id="statisticsSection"></div>
      <div id="settingsSection"></div>
      <div id="toast"></div>
      <span id="toastMessage"></span>
      <span id="totalIncome"></span>
      <span id="totalExpense"></span>
      <span id="statsBalance"></span>
      <div id="trendChart"></div>
      <div id="incomeCategoryChart"></div>
      <div id="expenseCategoryChart"></div>
    `;
  });

  describe('changeMonth 方法', () => {
    test('应该正确增加月份', () => {
      App.currentYear = 2024;
      App.currentMonth = 1;
      
      App.changeMonth(1);
      
      expect(App.currentMonth).toBe(2);
      expect(App.currentYear).toBe(2024);
    });

    test('应该正确减少月份', () => {
      App.currentYear = 2024;
      App.currentMonth = 2;
      
      App.changeMonth(-1);
      
      expect(App.currentMonth).toBe(1);
      expect(App.currentYear).toBe(2024);
    });

    test('应该正确处理月份溢出(12 -> 1)', () => {
      App.currentYear = 2024;
      App.currentMonth = 12;
      
      App.changeMonth(1);
      
      expect(App.currentMonth).toBe(1);
      expect(App.currentYear).toBe(2025);
    });

    test('应该正确处理月份溢出(1 -> 12)', () => {
      App.currentYear = 2024;
      App.currentMonth = 1;
      
      App.changeMonth(-1);
      
      expect(App.currentMonth).toBe(12);
      expect(App.currentYear).toBe(2023);
    });
  });

  describe('getDateStr 方法', () => {
    test('应该正确格式化日期字符串', () => {
      const dateStr = App.getDateStr(2024, 1, 15);
      expect(dateStr).toBe('2024-01-15');
    });

    test('应该正确处理月份溢出', () => {
      const dateStr1 = App.getDateStr(2024, 13, 1);
      expect(dateStr1).toBe('2025-01-01');
      
      const dateStr2 = App.getDateStr(2024, 0, 1);
      expect(dateStr2).toBe('2023-12-01');
    });

    test('应该正确补零', () => {
      const dateStr = App.getDateStr(2024, 1, 5);
      expect(dateStr).toBe('2024-01-05');
    });
  });

  describe('formatAmount 方法', () => {
    test('应该正确格式化小于 10000 的金额', () => {
      const formatted1 = App.formatAmount(5000);
      expect(formatted1).toBe('5000');
      
      const formatted2 = App.formatAmount(123.45);
      expect(formatted2).toBe('123');
      
      const formatted3 = App.formatAmount(9999);
      expect(formatted3).toBe('9999');
    });

    test('应该正确格式化大于等于 10000 的金额', () => {
      const formatted1 = App.formatAmount(10000);
      expect(formatted1).toBe('1.0w');
      
      const formatted2 = App.formatAmount(15000);
      expect(formatted2).toBe('1.5w');
      
      const formatted3 = App.formatAmount(123456);
      expect(formatted3).toBe('12.3w');
    });
  });

  describe('getCategoryName 方法', () => {
    test('应该正确获取分类名称', () => {
      const name1 = App.getCategoryName('food', 'expense');
      expect(name1).toBe('餐饮');
      
      const name2 = App.getCategoryName('salary', 'income');
      expect(name2).toBe('工资');
    });

    test('应该返回原始 ID 如果分类不存在', () => {
      const name = App.getCategoryName('invalid-category', 'expense');
      expect(name).toBe('invalid-category');
    });
  });

  describe('switchPage 方法', () => {
    test('应该正确切换到日历页面', () => {
      App.switchPage('calendar');
      
      expect(App.currentPage).toBe('calendar');
      expect(document.getElementById('calendarSection').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('statisticsSection').classList.contains('hidden')).toBe(true);
      expect(document.getElementById('settingsSection').classList.contains('hidden')).toBe(true);
    });

    test('应该正确切换到统计页面', () => {
      App.switchPage('statistics');
      
      expect(App.currentPage).toBe('statistics');
      expect(document.getElementById('calendarSection').classList.contains('hidden')).toBe(true);
      expect(document.getElementById('statisticsSection').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('settingsSection').classList.contains('hidden')).toBe(true);
    });

    test('应该正确切换到设置页面', () => {
      App.switchPage('settings');
      
      expect(App.currentPage).toBe('settings');
      expect(document.getElementById('calendarSection').classList.contains('hidden')).toBe(true);
      expect(document.getElementById('statisticsSection').classList.contains('hidden')).toBe(true);
      expect(document.getElementById('settingsSection').classList.contains('hidden')).toBe(false);
    });
  });

  describe('switchStatsRange 方法', () => {
    test('应该正确切换统计范围', () => {
      App.switchStatsRange('week');
      expect(App.currentStatsRange).toBe('week');
      
      App.switchStatsRange('month');
      expect(App.currentStatsRange).toBe('month');
      
      App.switchStatsRange('year');
      expect(App.currentStatsRange).toBe('year');
    });
  });

  describe('updateTotalBalance 方法', () => {
    test('应该正确更新总余额', () => {
      DataManager.addRecord({
        type: 'income',
        amount: 5000,
        category: 'salary',
        date: '2024-01-01'
      });
      DataManager.addRecord({
        type: 'expense',
        amount: 1000,
        category: 'food',
        date: '2024-01-01'
      });
      
      App.updateTotalBalance();
      
      const balanceEl = document.getElementById('totalBalance');
      expect(balanceEl.textContent).toBe('¥4000.00');
      expect(balanceEl.style.color).toBe('rgb(76, 175, 80)');
    });

    test('应该正确显示负余额', () => {
      DataManager.addRecord({
        type: 'expense',
        amount: 5000,
        category: 'food',
        date: '2024-01-01'
      });
      DataManager.addRecord({
        type: 'income',
        amount: 1000,
        category: 'salary',
        date: '2024-01-01'
      });
      
      App.updateTotalBalance();
      
      const balanceEl = document.getElementById('totalBalance');
      expect(balanceEl.textContent).toBe('¥-4000.00');
      expect(balanceEl.style.color).toBe('rgb(244, 67, 54)');
    });
  });

  describe('showToast 方法', () => {
    test('应该正确显示提示消息', () => {
      App.showToast('测试消息');
      
      const toast = document.getElementById('toast');
      const message = document.getElementById('toastMessage');
      
      expect(message.textContent).toBe('测试消息');
      expect(toast.classList.contains('hidden')).toBe(false);
    });
  });
});