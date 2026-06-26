if (typeof module !== 'undefined' && module.exports) {
    global.DataManager = require('./data.js');
    global.ChartManager = require('./chart.js');
}

const App = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    currentPage: 'calendar',
    currentRecordType: 'expense',
    selectedDate: null,
    currentDate: null,
    editingRecordId: null,
    currentStatsRange: 'month',
    confirmCallback: null,

    init() {
        DataManager.init();
        this.bindEvents();
        this.renderCalendar();
        this.updateMonthDisplay();
        this.updateTotalBalance();
    },

    bindEvents() {
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchPage(e.currentTarget.dataset.page));
        });

        document.getElementById('addRecordBtn').addEventListener('click', () => this.openRecordModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeRecordModal());
        document.getElementById('recordModal').addEventListener('click', (e) => {
            if (e.target.id === 'recordModal') this.closeRecordModal();
        });

        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchRecordType(e.currentTarget.dataset.type));
        });

        document.getElementById('recordForm').addEventListener('submit', (e) => this.handleRecordSubmit(e));

        document.getElementById('closeDetailModal').addEventListener('click', () => this.closeDayDetailModal());
        document.getElementById('dayDetailModal').addEventListener('click', (e) => {
            if (e.target.id === 'dayDetailModal') this.closeDayDetailModal();
        });
        document.getElementById('addDayRecord').addEventListener('click', () => this.openRecordModalFromDay());

        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchStatsRange(e.currentTarget.dataset.range));
        });

        document.getElementById('backupData').addEventListener('click', () => this.backupData());
        document.getElementById('restoreData').addEventListener('click', () => document.getElementById('restoreFile').click());
        document.getElementById('restoreFile').addEventListener('change', (e) => this.restoreData(e));
        document.getElementById('clearData').addEventListener('click', () => this.confirmClearData());
        document.getElementById('exportData').addEventListener('click', () => this.exportData());

        document.getElementById('cancelConfirm').addEventListener('click', () => this.closeConfirmModal());
        document.getElementById('confirmAction').addEventListener('click', () => this.handleConfirm());
    },

    changeMonth(delta) {
        this.currentMonth += delta;
        if (this.currentMonth > 12) {
            this.currentMonth = 1;
            this.currentYear++;
        } else if (this.currentMonth < 1) {
            this.currentMonth = 12;
            this.currentYear--;
        }
        this.updateMonthDisplay();
        this.renderCalendar();
    },

    updateMonthDisplay() {
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                           '七月', '八月', '九月', '十月', '十一月', '十二月'];
        document.getElementById('currentMonth').textContent = `${this.currentYear}年${monthNames[this.currentMonth - 1]}`;
    },

    renderCalendar() {
        const calendarBody = document.getElementById('calendarBody');
        calendarBody.innerHTML = '';

        const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay() || 7;

        const today = new Date();
        const todayStr = DataManager.formatDate(today);

        const records = DataManager.getRecordsByMonth(this.currentYear, this.currentMonth);
        const dailyStats = DataManager.getDailyStats(records);

        const prevMonthLastDay = new Date(this.currentYear, this.currentMonth - 1, 0).getDate();
        
        for (let i = startDayOfWeek - 1; i > 0; i--) {
            const day = prevMonthLastDay - i + 1;
            const dateStr = this.getDateStr(this.currentYear, this.currentMonth - 1, day);
            const dayEl = this.createDayElement(day, dateStr, true, false, dailyStats[dateStr], todayStr);
            calendarBody.appendChild(dayEl);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = this.getDateStr(this.currentYear, this.currentMonth, day);
            const isToday = dateStr === todayStr;
            const hasRecords = dailyStats[dateStr] && (dailyStats[dateStr].income > 0 || dailyStats[dateStr].expense > 0);
            const dayEl = this.createDayElement(day, dateStr, false, isToday, dailyStats[dateStr], todayStr, hasRecords);
            calendarBody.appendChild(dayEl);
        }

        const remainingDays = 42 - calendarBody.children.length;
        for (let day = 1; day <= remainingDays; day++) {
            const dateStr = this.getDateStr(this.currentYear, this.currentMonth + 1, day);
            const dayEl = this.createDayElement(day, dateStr, true, false, null, todayStr);
            calendarBody.appendChild(dayEl);
        }
    },

    getDateStr(year, month, day) {
        const m = month < 1 ? 12 : (month > 12 ? 1 : month);
        const y = month < 1 ? year - 1 : (month > 12 ? year + 1 : year);
        return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    },

    createDayElement(day, dateStr, isOtherMonth, isToday, stats, todayStr, hasRecords) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        if (isOtherMonth) dayEl.classList.add('other-month');
        if (isToday) dayEl.classList.add('today');
        if (hasRecords) dayEl.classList.add('has-record');

        const numberEl = document.createElement('div');
        numberEl.className = 'day-number';
        numberEl.textContent = day;
        dayEl.appendChild(numberEl);

        if (!isOtherMonth && stats) {
            const amountsEl = document.createElement('div');
            amountsEl.className = 'day-amounts';
            
            if (stats.income > 0) {
                const incomeEl = document.createElement('div');
                incomeEl.className = 'amount-item income';
                incomeEl.innerHTML = `<i class="fas fa-arrow-up"></i>${this.formatAmount(stats.income)}`;
                amountsEl.appendChild(incomeEl);
            }
            
            if (stats.expense > 0) {
                const expenseEl = document.createElement('div');
                expenseEl.className = 'amount-item expense';
                expenseEl.innerHTML = `<i class="fas fa-arrow-down"></i>${this.formatAmount(stats.expense)}`;
                amountsEl.appendChild(expenseEl);
            }
            
            if (amountsEl.children.length > 0) {
                dayEl.appendChild(amountsEl);
            }
        }

        dayEl.addEventListener('click', () => this.showDayDetail(dateStr));

        return dayEl;
    },

    formatAmount(amount) {
        if (amount >= 10000) {
            return (amount / 10000).toFixed(1) + 'w';
        }
        return amount.toFixed(0);
    },

    showDayDetail(dateStr) {
        this.selectedDate = dateStr;
        const records = DataManager.getRecordsByDate(dateStr);
        
        document.getElementById('detailDate').textContent = DataManager.formatDateCN(dateStr + 'T00:00:00');
        
        const income = DataManager.getTotalByType(records, 'income');
        const expense = DataManager.getTotalByType(records, 'expense');
        
        document.querySelector('.day-stat:nth-child(1) .income-value').textContent = `¥${income.toFixed(2)}`;
        document.querySelector('.day-stat:nth-child(2) .expense-value').textContent = `¥${expense.toFixed(2)}`;

        const recordsEl = document.getElementById('dayRecords');
        recordsEl.innerHTML = '';

        if (records.length === 0) {
            recordsEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>暂无记录</p>
                </div>
            `;
        } else {
            records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            records.forEach(record => {
                const itemEl = document.createElement('div');
                itemEl.className = 'day-record-item';
                itemEl.innerHTML = `
                    <div class="record-info">
                        <span class="record-category">${this.getCategoryName(record.category, record.type)}</span>
                        ${record.remark ? `<span class="record-remark">${record.remark}</span>` : ''}
                    </div>
                    <div class="record-actions">
                        <button class="record-action-btn edit" data-id="${record.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="record-action-btn delete" data-id="${record.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <span class="record-amount ${record.type}">
                        ${record.type === 'income' ? '+' : '-'}¥${record.amount.toFixed(2)}
                    </span>
                `;
                recordsEl.appendChild(itemEl);
            });

            recordsEl.querySelectorAll('.edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.editRecord(btn.dataset.id);
                });
            });

            recordsEl.querySelectorAll('.delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.confirmDeleteRecord(btn.dataset.id);
                });
            });
        }

        document.getElementById('dayDetailModal').classList.remove('hidden');
    },

    closeDayDetailModal() {
        document.getElementById('dayDetailModal').classList.add('hidden');
        this.selectedDate = null;
    },

    getCategoryName(categoryId, type) {
        const categories = DataManager.CATEGORIES[type];
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : categoryId;
    },

    openRecordModal(type = 'expense', date = null) {
        this.currentRecordType = type;
        this.switchRecordType(type);
        
        if (date) {
            this.currentDate = date;
        } else {
            this.currentDate = this.selectedDate || DataManager.formatDate(new Date());
        }

        if (this.editingRecordId) {
            document.getElementById('modalTitle').textContent = '编辑记录';
            const record = DataManager.getRecordById(this.editingRecordId);
            if (record) {
                this.switchRecordType(record.type);
                document.getElementById('amount').value = record.amount;
                document.getElementById('category').value = record.category;
                this.currentDate = record.date;
                document.getElementById('remark').value = record.remark || '';
            }
        } else {
            document.getElementById('modalTitle').textContent = '添加记录';
            document.getElementById('recordForm').reset();
        }

        document.getElementById('recordModal').classList.remove('hidden');
    },

    openRecordModalFromDay() {
        const dateStr = this.selectedDate;
        this.closeDayDetailModal();
        this.editingRecordId = null;
        this.openRecordModal('expense', dateStr);
    },

    closeRecordModal() {
        document.getElementById('recordModal').classList.add('hidden');
        this.editingRecordId = null;
        document.getElementById('recordForm').reset();
    },

    switchRecordType(type) {
        this.currentRecordType = type;
        
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        const categorySelect = document.getElementById('category');
        categorySelect.innerHTML = '<option value="">请选择分类</option>';
        
        DataManager.CATEGORIES[type].forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
    },

    handleRecordSubmit(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const remark = document.getElementById('remark').value;

        if (!amount || !category) {
            this.showToast('请填写完整信息');
            return;
        }

        const recordData = {
            type: this.currentRecordType,
            amount: amount,
            category: category,
            date: this.currentDate,
            remark: remark
        };

        if (this.editingRecordId) {
            DataManager.updateRecord(this.editingRecordId, recordData);
            this.showToast('记录已更新');
        } else {
            DataManager.addRecord(recordData);
            this.showToast('记录已添加');
        }

        this.closeRecordModal();
        this.renderCalendar();
        this.updateTotalBalance();
        
        if (this.currentPage === 'statistics') {
            this.renderStatistics();
        }
        
        if (this.selectedDate) {
            this.showDayDetail(this.selectedDate);
        }
    },

    editRecord(id) {
        this.editingRecordId = id;
        this.closeDayDetailModal();
        
        const record = DataManager.getRecordById(id);
        if (record) {
            this.openRecordModal(record.type, record.date);
        }
    },

    confirmDeleteRecord(id) {
        this.confirmCallback = () => {
            DataManager.deleteRecord(id);
            this.showToast('记录已删除');
            this.closeDayDetailModal();
            this.renderCalendar();
            this.updateTotalBalance();
            
            if (this.currentPage === 'statistics') {
                this.renderStatistics();
            }
        };
        
        document.getElementById('confirmMessage').textContent = '确定要删除这条记录吗？';
        document.getElementById('confirmModal').classList.remove('hidden');
    },

    handleConfirm() {
        if (this.confirmCallback) {
            this.confirmCallback();
            this.confirmCallback = null;
        }
        this.closeConfirmModal();
    },

    closeConfirmModal() {
        document.getElementById('confirmModal').classList.add('hidden');
        this.confirmCallback = null;
    },

    switchPage(page) {
        this.currentPage = page;
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        document.getElementById('calendarSection').classList.toggle('hidden', page !== 'calendar');
        document.getElementById('statisticsSection').classList.toggle('hidden', page !== 'statistics');
        document.getElementById('settingsSection').classList.toggle('hidden', page !== 'settings');

        if (page === 'statistics') {
            this.renderStatistics();
        }
    },

    switchStatsRange(range) {
        this.currentStatsRange = range;
        
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.range === range);
        });

        this.renderStatistics();
    },

    renderStatistics() {
        const now = new Date();
        let records = [];
        let trendData = [];

        switch (this.currentStatsRange) {
            case 'month':
                records = DataManager.getRecordsByMonth(now.getFullYear(), now.getMonth() + 1);
                trendData = DataManager.getDailyTrend(records, now.getFullYear(), now.getMonth() + 1);
                trendData = trendData.map(d => ({ label: d.day, income: d.income, expense: d.expense }));
                break;
            case 'year':
                records = DataManager.getRecordsByYear(now.getFullYear());
                trendData = DataManager.getMonthlyTrend(records, now.getFullYear());
                trendData = trendData.map(d => ({ label: d.month, income: d.income, expense: d.expense }));
                break;
            case 'week':
                const weekRange = DataManager.getWeekRange(now);
                records = DataManager.getRecordsByDateRange(weekRange.start, weekRange.end);
                const year = now.getFullYear();
                const month = now.getMonth() + 1;
                trendData = DataManager.getWeeklyTrend(records, year, month);
                trendData = trendData.map(d => ({ label: d.week, income: d.income, expense: d.expense }));
                break;
        }

        const totalIncome = DataManager.getTotalByType(records, 'income');
        const totalExpense = DataManager.getTotalByType(records, 'expense');
        const balance = totalIncome - totalExpense;

        document.getElementById('totalIncome').textContent = `¥${totalIncome.toFixed(2)}`;
        document.getElementById('totalExpense').textContent = `¥${totalExpense.toFixed(2)}`;
        document.getElementById('statsBalance').textContent = `¥${balance.toFixed(2)}`;

        if (balance >= 0) {
            document.getElementById('statsBalance').style.color = '#4CAF50';
        } else {
            document.getElementById('statsBalance').style.color = '#F44336';
        }

        ChartManager.init();
        ChartManager.renderTrendChart(trendData, this.currentStatsRange);

        const expenseStats = DataManager.getCategoryStats(records, 'expense');
        const incomeStats = DataManager.getCategoryStats(records, 'income');

        const expenseData = Object.entries(expenseStats).map(([name, value]) => ({ name, value }));
        const incomeData = Object.entries(incomeStats).map(([name, value]) => ({ name, value }));

        ChartManager.renderCategoryChart(incomeData, expenseData);
    },

    backupData() {
        const data = DataManager.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enlightenrich_backup_${DataManager.formatDate(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('数据已导出');
    },

    restoreData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = DataManager.importData(event.target.result);
            if (result.success) {
                this.showToast(`成功导入 ${result.count} 条记录`);
                this.renderCalendar();
                this.updateTotalBalance();
            } else {
                this.showToast('导入失败: ' + result.error);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    },

    confirmClearData() {
        this.confirmCallback = () => {
            DataManager.clearAllData();
            this.showToast('数据已清空');
            this.renderCalendar();
            this.updateTotalBalance();
            if (this.currentPage === 'statistics') {
                this.renderStatistics();
            }
        };
        
        document.getElementById('confirmMessage').textContent = '确定要清空所有数据吗？此操作不可恢复！';
        document.getElementById('confirmModal').classList.remove('hidden');
    },

    exportData() {
        const data = DataManager.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enlightenrich_data_${DataManager.formatDate(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('数据已导出');
    },

    showToast(message) {
        const toast = document.getElementById('toast');
        document.getElementById('toastMessage').textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.add('hidden');
                toast.classList.remove('show');
            }, 300);
        }, 2000);
    },

    updateTotalBalance() {
        const records = DataManager.getRecords();
        const totalIncome = DataManager.getTotalByType(records, 'income');
        const totalExpense = DataManager.getTotalByType(records, 'expense');
        const balance = totalIncome - totalExpense;
        
        const balanceEl = document.getElementById('totalBalance');
        balanceEl.textContent = `¥${balance.toFixed(2)}`;
        
        if (balance >= 0) {
            balanceEl.style.color = '#4CAF50';
        } else {
            balanceEl.style.color = '#F44336';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
