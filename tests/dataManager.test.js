const DataManager = require('../data.js');

describe('DataManager', () => {
  beforeEach(() => {
    localStorage.clear();
    DataManager.init();
  });

  describe('初始化', () => {
    test('应该初始化 localStorage', () => {
      expect(localStorage.getItem(DataManager.STORAGE_KEY)).toBe('[]');
    });
  });

  describe('记录增删改查', () => {
    test('应该成功添加记录', () => {
      const record = {
        type: 'expense',
        amount: 100,
        category: 'food',
        date: '2024-01-01',
        remark: '午餐'
      };
      
      const newRecord = DataManager.addRecord(record);
      
      expect(newRecord.id).toBeDefined();
      expect(newRecord.createdAt).toBeDefined();
      expect(newRecord.type).toBe('expense');
      expect(newRecord.amount).toBe(100);
      
      const records = DataManager.getRecords();
      expect(records.length).toBe(1);
    });

    test('应该成功更新记录', () => {
      const record = DataManager.addRecord({
        type: 'expense',
        amount: 100,
        category: 'food',
        date: '2024-01-01'
      });
      
      const updated = DataManager.updateRecord(record.id, {
        amount: 150,
        remark: '晚餐'
      });
      
      expect(updated.amount).toBe(150);
      expect(updated.remark).toBe('晚餐');
      expect(updated.updatedAt).toBeDefined();
    });

    test('应该成功删除记录', () => {
      const record = DataManager.addRecord({
        type: 'expense',
        amount: 100,
        category: 'food',
        date: '2024-01-01'
      });
      
      DataManager.deleteRecord(record.id);
      
      const records = DataManager.getRecords();
      expect(records.length).toBe(0);
    });

    test('应该通过 ID 获取记录', () => {
      const record = DataManager.addRecord({
        type: 'expense',
        amount: 100,
        category: 'food',
        date: '2024-01-01'
      });
      
      const found = DataManager.getRecordById(record.id);
      expect(found).toEqual(record);
      
      const notFound = DataManager.getRecordById('invalid-id');
      expect(notFound).toBeUndefined();
    });
  });

  describe('数据查询方法', () => {
    beforeEach(() => {
      DataManager.addRecord({
        type: 'expense',
        amount: 100,
        category: 'food',
        date: '2024-01-01'
      });
      DataManager.addRecord({
        type: 'income',
        amount: 5000,
        category: 'salary',
        date: '2024-01-01'
      });
      DataManager.addRecord({
        type: 'expense',
        amount: 200,
        category: 'transport',
        date: '2024-01-02'
      });
      DataManager.addRecord({
        type: 'income',
        amount: 1000,
        category: 'bonus',
        date: '2024-02-01'
      });
    });

    test('应该按日期查询记录', () => {
      const records = DataManager.getRecordsByDate('2024-01-01');
      expect(records.length).toBe(2);
    });

    test('应该按日期范围查询记录', () => {
      const records = DataManager.getRecordsByDateRange('2024-01-01', '2024-01-02');
      expect(records.length).toBe(3);
    });

    test('应该按月份查询记录', () => {
      const records = DataManager.getRecordsByMonth(2024, 1);
      expect(records.length).toBe(3);
      
      const febRecords = DataManager.getRecordsByMonth(2024, 2);
      expect(febRecords.length).toBe(1);
    });

    test('应该按年份查询记录', () => {
      const records = DataManager.getRecordsByYear(2024);
      expect(records.length).toBe(4);
    });

    test('应该获取周范围', () => {
      const weekRange = DataManager.getWeekRange(new Date('2024-01-03'));
      expect(weekRange.start).toBe('2024-01-01');
      expect(weekRange.end).toBe('2024-01-07');
    });
  });

  describe('数据统计方法', () => {
    beforeEach(() => {
      DataManager.addRecord({
        type: 'expense',
        amount: 100,
        category: 'food',
        date: '2024-01-01'
      });
      DataManager.addRecord({
        type: 'income',
        amount: 5000,
        category: 'salary',
        date: '2024-01-01'
      });
      DataManager.addRecord({
        type: 'expense',
        amount: 200,
        category: 'food',
        date: '2024-01-02'
      });
      DataManager.addRecord({
        type: 'income',
        amount: 1000,
        category: 'bonus',
        date: '2024-01-02'
      });
    });

    test('应该计算每日统计', () => {
      const stats = DataManager.getDailyStats(DataManager.getRecords());
      
      expect(stats['2024-01-01']).toEqual({
        income: 5000,
        expense: 100
      });
      expect(stats['2024-01-02']).toEqual({
        income: 1000,
        expense: 200
      });
    });

    test('应该按类型计算总额', () => {
      const records = DataManager.getRecords();
      
      const totalIncome = DataManager.getTotalByType(records, 'income');
      expect(totalIncome).toBe(6000);
      
      const totalExpense = DataManager.getTotalByType(records, 'expense');
      expect(totalExpense).toBe(300);
    });

    test('应该计算分类统计', () => {
      const records = DataManager.getRecords();
      
      const expenseStats = DataManager.getCategoryStats(records, 'expense');
      expect(expenseStats['food']).toBe(300);
      
      const incomeStats = DataManager.getCategoryStats(records, 'income');
      expect(incomeStats['salary']).toBe(5000);
      expect(incomeStats['bonus']).toBe(1000);
    });
  });

  describe('趋势数据生成方法', () => {
    beforeEach(() => {
      for (let day = 1; day <= 5; day++) {
        DataManager.addRecord({
          type: 'expense',
          amount: 100 * day,
          category: 'food',
          date: `2024-01-${String(day).padStart(2, '0')}`
        });
        DataManager.addRecord({
          type: 'income',
          amount: 1000,
          category: 'salary',
          date: `2024-01-${String(day).padStart(2, '0')}`
        });
      }
    });

    test('应该生成月度趋势', () => {
      const records = DataManager.getRecordsByYear(2024);
      const trend = DataManager.getMonthlyTrend(records, 2024);
      
      expect(trend.length).toBe(12);
      expect(trend[0].month).toBe('1月');
      expect(trend[0].income).toBe(5000);
      expect(trend[0].expense).toBe(1500);
    });

    test('应该生成周趋势', () => {
      const records = DataManager.getRecordsByMonth(2024, 1);
      const trend = DataManager.getWeeklyTrend(records, 2024, 1);
      
      expect(trend.length).toBeGreaterThan(0);
      expect(trend[0].week).toBe('第1周');
      expect(trend[0].income).toBe(5000);
      expect(trend[0].expense).toBe(1500);
    });

    test('应该生成日趋势', () => {
      const records = DataManager.getRecordsByMonth(2024, 1);
      const trend = DataManager.getDailyTrend(records, 2024, 1);
      
      expect(trend.length).toBe(31);
      expect(trend[0].day).toBe('1日');
      expect(trend[0].income).toBe(1000);
      expect(trend[0].expense).toBe(100);
    });
  });

  describe('数据导入导出', () => {
    test('应该成功导出数据', () => {
      DataManager.addRecord({
        type: 'expense',
        amount: 100,
        category: 'food',
        date: '2024-01-01'
      });
      
      const exported = DataManager.exportData();
      const data = JSON.parse(exported);
      
      expect(data.version).toBe('1.0.0');
      expect(data.exportDate).toBeDefined();
      expect(data.records.length).toBe(1);
    });

    test('应该成功导入数据', () => {
      const jsonString = JSON.stringify({
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        records: [
          {
            id: 'test-id',
            type: 'expense',
            amount: 100,
            category: 'food',
            date: '2024-01-01',
            createdAt: new Date().toISOString()
          }
        ]
      });
      
      const result = DataManager.importData(jsonString);
      
      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      
      const records = DataManager.getRecords();
      expect(records.length).toBe(1);
    });

    test('应该拒绝无效的数据格式', () => {
      const result = DataManager.importData('invalid json');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      const result2 = DataManager.importData(JSON.stringify({ invalid: 'format' }));
      expect(result2.success).toBe(false);
    });
  });

  describe('工具方法', () => {
    test('应该生成唯一 ID', () => {
      const id1 = DataManager.generateId();
      const id2 = DataManager.generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    test('应该格式化日期', () => {
      const date = new Date('2024-01-15');
      const formatted = DataManager.formatDate(date);
      
      expect(formatted).toBe('2024-01-15');
    });

    test('应该格式化中文日期', () => {
      const date = new Date('2024-01-15T00:00:00');
      const formatted = DataManager.formatDateCN(date);
      
      expect(formatted).toBe('2024年1月15日');
    });

    test('应该格式化金额', () => {
      const amount = DataManager.formatAmount(123.456);
      expect(amount).toBe('123.46');
    });
  });

  describe('数据管理', () => {
    test('应该清空所有数据', () => {
      DataManager.addRecord({
        type: 'expense',
        amount: 100,
        category: 'food',
        date: '2024-01-01'
      });
      
      DataManager.clearAllData();
      
      const records = DataManager.getRecords();
      expect(records.length).toBe(0);
    });

    test('应该获取存储信息', () => {
      DataManager.addRecord({
        type: 'expense',
        amount: 100,
        category: 'food',
        date: '2024-01-01'
      });
      DataManager.addRecord({
        type: 'income',
        amount: 5000,
        category: 'salary',
        date: '2024-01-01'
      });
      
      const info = DataManager.getStorageInfo();
      
      expect(info.total).toBe(2);
      expect(info.income).toBe(5000);
      expect(info.expense).toBe(100);
    });
  });
});