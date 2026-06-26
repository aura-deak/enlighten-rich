if (typeof module !== 'undefined' && module.exports) {
    global.DataManager = require('./data.js');
}

const ChartManager = {
    trendChart: null,
    incomeCategoryChart: null,
    expenseCategoryChart: null,

    init() {
        this.trendChart = echarts.init(document.getElementById('trendChart'));
        this.incomeCategoryChart = echarts.init(document.getElementById('incomeCategoryChart'));
        this.expenseCategoryChart = echarts.init(document.getElementById('expenseCategoryChart'));
        
        window.addEventListener('resize', () => {
            this.trendChart && this.trendChart.resize();
            this.incomeCategoryChart && this.incomeCategoryChart.resize();
            this.expenseCategoryChart && this.expenseCategoryChart.resize();
        });
    },

    renderTrendChart(data, rangeType) {
        if (!this.trendChart) return;

        const option = {
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#FFC107',
                borderWidth: 1,
                textStyle: {
                    color: '#333'
                },
                formatter: function(params) {
                    let result = `<div style="font-weight:600;margin-bottom:5px;">${params[0].name}</div>`;
                    params.forEach(param => {
                        const color = param.seriesName === '收入' ? '#4CAF50' : '#F44336';
                        result += `<div style="display:flex;align-items:center;gap:5px;">
                            <span style="width:10px;height:10px;border-radius:50%;background:${color};"></span>
                            <span>${param.seriesName}: </span>
                            <span style="font-weight:600;">¥${param.value.toFixed(2)}</span>
                        </div>`;
                    });
                    return result;
                }
            },
            legend: {
                data: ['收入', '支出'],
                bottom: 0,
                itemWidth: 12,
                itemHeight: 12,
                textStyle: {
                    color: '#666'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: data.map(d => d.label),
                axisLine: {
                    lineStyle: {
                        color: '#E0E0E0'
                    }
                },
                axisLabel: {
                    color: '#666',
                    fontSize: 10,
                    interval: Math.floor(data.length / 7)
                },
                axisTick: {
                    show: false
                }
            },
            yAxis: {
                type: 'value',
                axisLine: {
                    show: false
                },
                axisLabel: {
                    color: '#999',
                    fontSize: 10,
                    formatter: function(value) {
                        if (value >= 10000) {
                            return (value / 10000).toFixed(1) + 'w';
                        }
                        return value;
                    }
                },
                splitLine: {
                    lineStyle: {
                        color: '#F0F0F0',
                        type: 'dashed'
                    }
                }
            },
            series: [
                {
                    name: '收入',
                    type: 'line',
                    data: data.map(d => d.income),
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 6,
                    itemStyle: {
                        color: '#4CAF50'
                    },
                    lineStyle: {
                        width: 2
                    },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(76, 175, 80, 0.3)' },
                                { offset: 1, color: 'rgba(76, 175, 80, 0.05)' }
                            ]
                        }
                    }
                },
                {
                    name: '支出',
                    type: 'line',
                    data: data.map(d => d.expense),
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 6,
                    itemStyle: {
                        color: '#F44336'
                    },
                    lineStyle: {
                        width: 2
                    },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(244, 67, 54, 0.3)' },
                                { offset: 1, color: 'rgba(244, 67, 54, 0.05)' }
                            ]
                        }
                    }
                }
            ]
        };

        this.trendChart.setOption(option, true);
    },

    renderCategoryChart(incomeData, expenseData) {
        const categoryNames = {};
        DataManager.CATEGORIES.expense.forEach(c => categoryNames[c.id] = c.name);
        DataManager.CATEGORIES.income.forEach(c => categoryNames[c.id] = c.name);

        const incomeColors = {
            salary: '#4CAF50',
            bonus: '#8BC34A',
            investment: '#00BCD4',
            parttime: '#CDDC39',
            gift_income: '#FF4081',
            refund: '#009688',
            other_income: '#9E9E9E'
        };

        const expenseColors = {
            food: '#FF9800',
            transport: '#2196F3',
            shopping: '#E91E63',
            entertainment: '#9C27B0',
            education: '#00BCD4',
            medical: '#F44336',
            housing: '#795548',
            utilities: '#607D8B',
            clothing: '#FF5722',
            digital: '#3F51B5',
            gift: '#E91E63',
            other_expense: '#9E9E9E'
        };

        if (!this.incomeCategoryChart || !this.expenseCategoryChart) return;

        const hasIncomeData = incomeData.some(d => d.value > 0);
        const hasExpenseData = expenseData.some(d => d.value > 0);

        if (!hasIncomeData) {
            this.incomeCategoryChart.setOption({
                graphic: {
                    type: 'text',
                    left: 'center',
                    top: 'middle',
                    style: {
                        text: '暂无收入数据',
                        fontSize: 14,
                        fill: '#999'
                    }
                },
                series: [{
                    data: []
                }]
            });
        } else {
            const incomeChartData = incomeData
                .filter(d => d.value > 0)
                .map(d => ({
                    name: categoryNames[d.name] || d.name,
                    value: d.value,
                    itemStyle: {
                        color: incomeColors[d.name] || '#9E9E9E'
                    }
                }));

            this.incomeCategoryChart.setOption({
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderColor: '#FFC107',
                    borderWidth: 1,
                    formatter: function(params) {
                        return `<div style="font-weight:600;">${params.name}</div>
                                <div>¥${params.value.toFixed(2)} (${params.percent.toFixed(1)}%)</div>`;
                    }
                },
                legend: {
                    orient: 'horizontal',
                    bottom: 0,
                    itemWidth: 10,
                    itemHeight: 10,
                    textStyle: {
                        color: '#666',
                        fontSize: 10
                    },
                    type: 'scroll',
                    maxHeight: 60
                },
                series: [
                    {
                        name: '收入分类',
                        type: 'pie',
                        radius: ['30%', '70%'],
                        center: ['50%', '45%'],
                        avoidLabelOverlap: true,
                        itemStyle: {
                            borderRadius: 6,
                            borderColor: '#fff',
                            borderWidth: 2
                        },
                        label: {
                            show: false
                        },
                        emphasis: {
                            label: {
                                show: true,
                                fontSize: 12,
                                fontWeight: 'bold'
                            }
                        },
                        labelLine: {
                            show: false
                        },
                        data: incomeChartData
                    }
                ]
            }, true);
        }

        if (!hasExpenseData) {
            this.expenseCategoryChart.setOption({
                graphic: {
                    type: 'text',
                    left: 'center',
                    top: 'middle',
                    style: {
                        text: '暂无支出数据',
                        fontSize: 14,
                        fill: '#999'
                    }
                },
                series: [{
                    data: []
                }]
            });
        } else {
            const expenseChartData = expenseData
                .filter(d => d.value > 0)
                .map(d => ({
                    name: categoryNames[d.name] || d.name,
                    value: d.value,
                    itemStyle: {
                        color: expenseColors[d.name] || '#9E9E9E'
                    }
                }));

            this.expenseCategoryChart.setOption({
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderColor: '#FFC107',
                    borderWidth: 1,
                    formatter: function(params) {
                        return `<div style="font-weight:600;">${params.name}</div>
                                <div>¥${params.value.toFixed(2)} (${params.percent.toFixed(1)}%)</div>`;
                    }
                },
                legend: {
                    orient: 'horizontal',
                    bottom: 0,
                    itemWidth: 10,
                    itemHeight: 10,
                    textStyle: {
                        color: '#666',
                        fontSize: 10
                    },
                    type: 'scroll',
                    maxHeight: 60
                },
                series: [
                    {
                        name: '支出分类',
                        type: 'pie',
                        radius: ['30%', '70%'],
                        center: ['50%', '45%'],
                        avoidLabelOverlap: true,
                        itemStyle: {
                            borderRadius: 6,
                            borderColor: '#fff',
                            borderWidth: 2
                        },
                        label: {
                            show: false
                        },
                        emphasis: {
                            label: {
                                show: true,
                                fontSize: 12,
                                fontWeight: 'bold'
                            }
                        },
                        labelLine: {
                            show: false
                        },
                        data: expenseChartData
                    }
                ]
            }, true);
        }
    },

    destroy() {
        if (this.trendChart) {
            this.trendChart.dispose();
            this.trendChart = null;
        }
        if (this.incomeCategoryChart) {
            this.incomeCategoryChart.dispose();
            this.incomeCategoryChart = null;
        }
        if (this.expenseCategoryChart) {
            this.expenseCategoryChart.dispose();
            this.expenseCategoryChart = null;
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
}
