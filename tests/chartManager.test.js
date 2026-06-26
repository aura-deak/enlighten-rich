const DataManager = require('../data.js');
const ChartManager = require('../chart.js');

global.echarts = {
  init: jest.fn(() => ({
    setOption: jest.fn(),
    resize: jest.fn(),
    dispose: jest.fn()
  }))
};

describe('ChartManager', () => {
  beforeEach(() => {
    localStorage.clear();
    DataManager.init();
    
    document.body.innerHTML = `
      <div id="trendChart"></div>
      <div id="incomeCategoryChart"></div>
      <div id="expenseCategoryChart"></div>
    `;
    
    ChartManager.trendChart = null;
    ChartManager.incomeCategoryChart = null;
    ChartManager.expenseCategoryChart = null;
    
    echarts.init.mockClear();
  });

  describe('init 方法', () => {
    test('应该正确初始化图表实例', () => {
      ChartManager.init();
      
      expect(ChartManager.trendChart).not.toBeNull();
      expect(ChartManager.incomeCategoryChart).not.toBeNull();
      expect(ChartManager.expenseCategoryChart).not.toBeNull();
    });

    test('应该添加窗口resize事件监听', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      ChartManager.init();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });
  });

  describe('renderTrendChart 方法', () => {
    test('应该在图表未初始化时返回', () => {
      const data = [{ label: '1日', income: 1000, expense: 500 }];
      
      const result = ChartManager.renderTrendChart(data, 'month');
      
      expect(result).toBeUndefined();
    });

    test('应该正确渲染趋势图', () => {
      ChartManager.init();
      const setOptionSpy = jest.spyOn(ChartManager.trendChart, 'setOption');
      
      const data = [
        { label: '1日', income: 1000, expense: 500 },
        { label: '2日', income: 2000, expense: 800 }
      ];
      
      ChartManager.renderTrendChart(data, 'month');
      
      expect(setOptionSpy).toHaveBeenCalled();
      const option = setOptionSpy.mock.calls[0][0];
      
      expect(option.xAxis.data).toEqual(['1日', '2日']);
      expect(option.series[0].data).toEqual([1000, 2000]);
      expect(option.series[1].data).toEqual([500, 800]);
      
      setOptionSpy.mockRestore();
    });
  });

  describe('renderCategoryChart 方法', () => {
    test('应该在图表未初始化时返回', () => {
      const result = ChartManager.renderCategoryChart([], []);
      
      expect(result).toBeUndefined();
    });

    test('应该正确渲染空数据时的提示', () => {
      ChartManager.init();
      const setOptionSpy1 = jest.spyOn(ChartManager.incomeCategoryChart, 'setOption');
      const setOptionSpy2 = jest.spyOn(ChartManager.expenseCategoryChart, 'setOption');
      
      ChartManager.renderCategoryChart([], []);
      
      expect(setOptionSpy1).toHaveBeenCalled();
      expect(setOptionSpy2).toHaveBeenCalled();
      
      const incomeOption = setOptionSpy1.mock.calls[0][0];
      const expenseOption = setOptionSpy2.mock.calls[0][0];
      
      expect(incomeOption.graphic.style.text).toBe('暂无收入数据');
      expect(expenseOption.graphic.style.text).toBe('暂无支出数据');
      
      setOptionSpy1.mockRestore();
      setOptionSpy2.mockRestore();
    });

    test('应该正确渲染分类饼图', () => {
      ChartManager.init();
      const setOptionSpy1 = jest.spyOn(ChartManager.incomeCategoryChart, 'setOption');
      const setOptionSpy2 = jest.spyOn(ChartManager.expenseCategoryChart, 'setOption');
      
      const incomeData = [
        { name: 'salary', value: 5000 },
        { name: 'bonus', value: 1000 }
      ];
      
      const expenseData = [
        { name: 'food', value: 1000 },
        { name: 'transport', value: 500 }
      ];
      
      ChartManager.renderCategoryChart(incomeData, expenseData);
      
      expect(setOptionSpy1).toHaveBeenCalled();
      expect(setOptionSpy2).toHaveBeenCalled();
      
      const incomeOption = setOptionSpy1.mock.calls[0][0];
      const expenseOption = setOptionSpy2.mock.calls[0][0];
      
      expect(incomeOption.series[0].data.length).toBe(2);
      expect(expenseOption.series[0].data.length).toBe(2);
      
      expect(incomeOption.series[0].data[0].name).toBe('工资');
      expect(incomeOption.series[0].data[1].name).toBe('奖金');
      expect(expenseOption.series[0].data[0].name).toBe('餐饮');
      expect(expenseOption.series[0].data[1].name).toBe('交通');
      
      setOptionSpy1.mockRestore();
      setOptionSpy2.mockRestore();
    });

    test('应该过滤值为0的数据', () => {
      ChartManager.init();
      const setOptionSpy1 = jest.spyOn(ChartManager.incomeCategoryChart, 'setOption');
      
      const incomeData = [
        { name: 'salary', value: 5000 },
        { name: 'bonus', value: 0 }
      ];
      
      ChartManager.renderCategoryChart(incomeData, []);
      
      const incomeOption = setOptionSpy1.mock.calls[0][0];
      expect(incomeOption.series[0].data.length).toBe(1);
      expect(incomeOption.series[0].data[0].name).toBe('工资');
      
      setOptionSpy1.mockRestore();
    });
  });

  describe('destroy 方法', () => {
    test('应该正确销毁图表实例', () => {
      ChartManager.init();
      const disposeSpy1 = jest.spyOn(ChartManager.trendChart, 'dispose');
      const disposeSpy2 = jest.spyOn(ChartManager.incomeCategoryChart, 'dispose');
      const disposeSpy3 = jest.spyOn(ChartManager.expenseCategoryChart, 'dispose');
      
      ChartManager.destroy();
      
      expect(disposeSpy1).toHaveBeenCalled();
      expect(disposeSpy2).toHaveBeenCalled();
      expect(disposeSpy3).toHaveBeenCalled();
      
      expect(ChartManager.trendChart).toBeNull();
      expect(ChartManager.incomeCategoryChart).toBeNull();
      expect(ChartManager.expenseCategoryChart).toBeNull();
      
      disposeSpy1.mockRestore();
      disposeSpy2.mockRestore();
      disposeSpy3.mockRestore();
    });

    test('应该处理未初始化的图表', () => {
      ChartManager.trendChart = null;
      ChartManager.incomeCategoryChart = null;
      ChartManager.expenseCategoryChart = null;
      
      expect(() => ChartManager.destroy()).not.toThrow();
    });
  });
});