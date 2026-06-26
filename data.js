var DataManager = {
    STORAGE_KEY: 'enlightenrich_records',
    BACKUP_KEY: 'enlightenrich_backup',

    CATEGORIES: {
        expense: [
            { id: 'food', name: '餐饮', icon: 'fa-utensils' },
            { id: 'transport', name: '交通', icon: 'fa-bus' },
            { id: 'shopping', name: '购物', icon: 'fa-shopping-bag' },
            { id: 'entertainment', name: '娱乐', icon: 'fa-gamepad' },
            { id: 'education', name: '教育', icon: 'fa-graduation-cap' },
            { id: 'medical', name: '医疗', icon: 'fa-hospital' },
            { id: 'housing', name: '住房', icon: 'fa-home' },
            { id: 'utilities', name: '水电费', icon: 'fa-lightbulb' },
            { id: 'clothing', name: '服装', icon: 'fa-tshirt' },
            { id: 'digital', name: '数码', icon: 'fa-mobile-alt' },
            { id: 'gift', name: '礼物', icon: 'fa-gift' },
            { id: 'other_expense', name: '其他', icon: 'fa-ellipsis-h' }
        ],
        income: [
            { id: 'salary', name: '工资', icon: 'fa-briefcase' },
            { id: 'bonus', name: '奖金', icon: 'fa-trophy' },
            { id: 'investment', name: '投资', icon: 'fa-chart-line' },
            { id: 'parttime', name: '兼职', icon: 'fa-laptop-house' },
            { id: 'gift_income', name: '礼金', icon: 'fa-hand-holding-heart' },
            { id: 'refund', name: '退款', icon: 'fa-undo' },
            { id: 'other_income', name: '其他', icon: 'fa-ellipsis-h' }
        ]
    },

    init() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
    },

    getRecords() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveRecords(records) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    },

    addRecord(record) {
        const records = this.getRecords();
        const newRecord = {
            id: this.generateId(),
            ...record,
            createdAt: new Date().toISOString()
        };
        records.push(newRecord);
        this.saveRecords(records);
        return newRecord;
    },

    updateRecord(id, updates) {
        const records = this.getRecords();
        const index = records.findIndex(r => r.id === id);
        if (index !== -1) {
            records[index] = { ...records[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveRecords(records);
            return records[index];
        }
        return null;
    },

    deleteRecord(id) {
        const records = this.getRecords();
        const filtered = records.filter(r => r.id !== id);
        this.saveRecords(filtered);
        return filtered;
    },

    getRecordById(id) {
        const records = this.getRecords();
        return records.find(r => r.id === id);
    },

    getRecordsByDate(date) {
        const records = this.getRecords();
        return records.filter(r => r.date === date);
    },

    getRecordsByDateRange(startDate, endDate) {
        const records = this.getRecords();
        return records.filter(r => r.date >= startDate && r.date <= endDate);
    },

    getRecordsByMonth(year, month) {
        const records = this.getRecords();
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        return records.filter(r => r.date.startsWith(monthStr));
    },

    getRecordsByYear(year) {
        const records = this.getRecords();
        return records.filter(r => r.date.startsWith(`${year}`));
    },

    getWeekRange(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(d.setDate(diff));
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return {
            start: this.formatDate(start),
            end: this.formatDate(end)
        };
    },

    getDailyStats(records) {
        const stats = {};
        records.forEach(record => {
            if (!stats[record.date]) {
                stats[record.date] = { income: 0, expense: 0 };
            }
            if (record.type === 'income') {
                stats[record.date].income += record.amount;
            } else {
                stats[record.date].expense += record.amount;
            }
        });
        return stats;
    },

    getTotalByType(records, type) {
        return records
            .filter(r => r.type === type)
            .reduce((sum, r) => sum + r.amount, 0);
    },

    getCategoryStats(records, type) {
        const stats = {};
        records
            .filter(r => r.type === type)
            .forEach(record => {
                if (!stats[record.category]) {
                    stats[record.category] = 0;
                }
                stats[record.category] += record.amount;
            });
        return stats;
    },

    getMonthlyTrend(records, year) {
        const trend = [];
        for (let month = 1; month <= 12; month++) {
            const monthStr = `${year}-${String(month).padStart(2, '0')}`;
            const monthRecords = records.filter(r => r.date.startsWith(monthStr));
            trend.push({
                month: `${month}月`,
                income: this.getTotalByType(monthRecords, 'income'),
                expense: this.getTotalByType(monthRecords, 'expense')
            });
        }
        return trend;
    },

    getWeeklyTrend(records, year, month) {
        const trend = [];
        const daysInMonth = new Date(year, month, 0).getDate();
        let currentWeek = 1;
        let weekStart = 1;
        
        while (weekStart <= daysInMonth) {
            const weekEnd = Math.min(weekStart + 6, daysInMonth);
            const weekRecords = records.filter(r => {
                const day = parseInt(r.date.split('-')[2]);
                return day >= weekStart && day <= weekEnd && 
                       r.date.startsWith(`${year}-${String(month).padStart(2, '0')}`);
            });
            trend.push({
                week: `第${currentWeek}周`,
                income: this.getTotalByType(weekRecords, 'income'),
                expense: this.getTotalByType(weekRecords, 'expense')
            });
            weekStart += 7;
            currentWeek++;
        }
        return trend;
    },

    getDailyTrend(records, year, month) {
        const trend = [];
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayRecords = records.filter(r => r.date === dateStr);
            trend.push({
                day: `${day}日`,
                income: this.getTotalByType(dayRecords, 'income'),
                expense: this.getTotalByType(dayRecords, 'expense')
            });
        }
        return trend;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    formatDate(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    formatDateCN(date) {
        const d = new Date(date);
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    },

    formatAmount(amount) {
        return amount.toFixed(2);
    },

    exportData() {
        const records = this.getRecords();
        const data = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            records: records
        };
        return JSON.stringify(data, null, 2);
    },

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.records || !Array.isArray(data.records)) {
                throw new Error('无效的数据格式');
            }
            this.saveRecords(data.records);
            return { success: true, count: data.records.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    clearAllData() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    },

    getStorageInfo() {
        const records = this.getRecords();
        return {
            total: records.length,
            income: this.getTotalByType(records, 'income'),
            expense: this.getTotalByType(records, 'expense')
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}
