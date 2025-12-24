// データ管理
class ExpenseManager {
    constructor() {
        this.expenses = this.loadFromStorage();
        this.currentWeekDate = new Date();
        this.currentMonthDate = new Date();
        this.currentYearDate = new Date();
    }

    loadFromStorage() {
        const data = localStorage.getItem('expenses');
        return data ? JSON.parse(data) : [];
    }

    saveToStorage() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }

    addExpense(date, category, amount, description) {
        const expense = {
            id: Date.now(),
            date,
            category,
            amount: parseFloat(amount),
            description
        };
        this.expenses.push(expense);
        this.saveToStorage();
        return expense;
    }

    deleteExpense(id) {
        this.expenses = this.expenses.filter(e => e.id !== id);
        this.saveToStorage();
    }

    getWeeklyExpenses(date) {
        const startOfWeek = this.getStartOfWeek(date);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        return this.expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= startOfWeek && expenseDate <= endOfWeek;
        });
    }

    getMonthlyExpenses(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        return this.expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
        });
    }

    getYearlyExpenses(year) {
        return this.expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getFullYear() === year;
        });
    }

    getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    groupByCategory(expenses) {
        return expenses.reduce((acc, expense) => {
            if (!acc[expense.category]) {
                acc[expense.category] = 0;
            }
            acc[expense.category] += expense.amount;
            return acc;
        }, {});
    }

    groupByMonth(year) {
        const months = {};
        for (let i = 0; i < 12; i++) {
            months[i] = 0;
        }

        this.getYearlyExpenses(year).forEach(expense => {
            const date = new Date(expense.date);
            months[date.getMonth()] += expense.amount;
        });

        return months;
    }
}

// レシート認識の初期化
async function initOCR() {
    try {
        const { createWorker } = Tesseract;
        const worker = await createWorker('jpn');
        return worker;
    } catch (error) {
        console.log('OCR初期化：オンライン版を使用します');
        return null;
    }
}

let ocrWorker = null;

// UI管理
const manager = new ExpenseManager();

// タブ切り替え
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        document.getElementById(tabId).classList.add('active');

        if (tabId === 'dashboard') updateDashboard();
        if (tabId === 'weekly') updateWeekly();
        if (tabId === 'monthly') updateMonthly();
        if (tabId === 'yearly') updateYearly();
    });
});

// 支出追加フォーム
document.getElementById('expenseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const date = document.getElementById('date').value;
    const category = document.getElementById('category').value;
    const amount = document.getElementById('amount').value;
    const description = document.getElementById('description').value;

    if (date && category && amount) {
        manager.addExpense(date, category, amount, description);
        document.getElementById('expenseForm').reset();
        document.getElementById('date').valueAsDate = new Date();
        updateExpenseList();
    }
});

// 支出リスト表示
function updateExpenseList() {
    const tbody = document.getElementById('expenseList');
    tbody.innerHTML = '';
    
    const sorted = [...manager.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sorted.forEach(expense => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${expense.date}</td>
            <td>${expense.category}</td>
            <td>¥${expense.amount.toLocaleString('ja-JP')}</td>
            <td>${expense.description}</td>
            <td><button class="delete-btn" onclick="deleteExpense(${expense.id})">削除</button></td>
        `;
        tbody.appendChild(row);
    });
}

function deleteExpense(id) {
    if (confirm('本当に削除しますか？')) {
        manager.deleteExpense(id);
        updateExpenseList();
    }
}

// 週間表示
function updateWeekly() {
    const weekExpenses = manager.getWeeklyExpenses(manager.currentWeekDate);
    const grouped = manager.groupByCategory(weekExpenses);
    
    updateLabel('weekLabel', manager.currentWeekDate);
    drawChart('weeklyChart', grouped);
    updateTable('weeklyTableBody', grouped, weekExpenses);
}

// 月間表示
function updateMonthly() {
    const monthExpenses = manager.getMonthlyExpenses(manager.currentMonthDate);
    const grouped = manager.groupByCategory(monthExpenses);
    
    updateMonthLabel('monthLabel', manager.currentMonthDate);
    drawChart('monthlyChart', grouped);
    updateTable('monthlyTableBody', grouped, monthExpenses);
}

document.getElementById('prevMonth').addEventListener('click', () => {
    manager.currentMonthDate.setMonth(manager.currentMonthDate.getMonth() - 1);
    updateMonthly();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    manager.currentMonthDate.setMonth(manager.currentMonthDate.getMonth() + 1);
    updateMonthly();
});

// ダッシュボード表示
function updateDashboard() {
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentYear = today.getFullYear();
    
    // 今月の支出
    const monthExpenses = manager.getMonthlyExpenses(currentMonth);
    const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // 先月の支出
    const lastMonth = new Date(currentMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthExpenses = manager.getMonthlyExpenses(lastMonth);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // 今週の支出
    const weekExpenses = manager.getWeeklyExpenses(today);
    const weekTotal = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // 先週の支出
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekExpenses = manager.getWeeklyExpenses(lastWeek);
    const lastWeekTotal = lastWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // 今年の支出
    const yearExpenses = manager.getYearlyExpenses(currentYear);
    const yearTotal = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // 1日平均
    const daysInYear = Math.floor((today - new Date(currentYear, 0, 1)) / (1000 * 60 * 60 * 24)) + 1;
    const dailyAverage = Math.round(yearTotal / daysInYear);
    
    // 合計件数
    const totalItems = manager.expenses.length;
    
    // 表示
    document.getElementById('monthTotal').textContent = `¥${monthTotal.toLocaleString('ja-JP')}`;
    document.getElementById('monthComparison').textContent = getComparison(monthTotal, lastMonthTotal);
    
    document.getElementById('weekTotal').textContent = `¥${weekTotal.toLocaleString('ja-JP')}`;
    document.getElementById('weekComparison').textContent = getComparison(weekTotal, lastWeekTotal);
    
    document.getElementById('yearTotal').textContent = `¥${yearTotal.toLocaleString('ja-JP')}`;
    document.getElementById('dailyAverage').textContent = `¥${dailyAverage.toLocaleString('ja-JP')}`;
    
    document.getElementById('totalItems').textContent = totalItems;
    
    // カテゴリ別グラフ
    const categoryData = manager.groupByCategory(monthExpenses);
    drawChart('dashboardCategoryChart', categoryData);
    updateDashboardCategoryTable(categoryData, monthExpenses);
    
    // 最近の支出
    updateDashboardRecent();
    
    // 月別推移グラフ
    const monthlyData = manager.groupByMonth(currentYear);
    drawYearlyChartDashboard('dashboardTrendChart', monthlyData);
}

function getComparison(current, previous) {
    if (previous === 0) return '初回データ';
    const diff = current - previous;
    const percent = Math.round((diff / previous) * 100);
    const arrow = diff > 0 ? '📈' : diff < 0 ? '📉' : '→';
    return `${arrow} ${Math.abs(percent)}%`;
}

function updateDashboardCategoryTable(grouped, expenses) {
    const tbody = document.getElementById('dashboardCategoryBody');
    const total = Object.values(grouped).reduce((a, b) => a + b, 0);
    
    tbody.innerHTML = Object.entries(grouped)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => {
            const percentage = ((amount / total) * 100).toFixed(1);
            return `
                <tr>
                    <td>${category}</td>
                    <td>¥${amount.toLocaleString('ja-JP')}</td>
                    <td>${percentage}%</td>
                </tr>
            `;
        })
        .join('');
    
    tbody.innerHTML += `
        <tr style="background: #f0f0f0; font-weight: bold;">
            <td>合計</td>
            <td>¥${total.toLocaleString('ja-JP')}</td>
            <td>100%</td>
        </tr>
    `;
}

function updateDashboardRecent() {
    const tbody = document.getElementById('dashboardRecentTable');
    const sorted = [...manager.expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
    
    tbody.innerHTML = sorted.map(expense => `
        <tr>
            <td>${expense.date}</td>
            <td>${expense.category}</td>
            <td>¥${expense.amount.toLocaleString('ja-JP')}</td>
            <td>${expense.description}</td>
        </tr>
    `).join('');
}

function drawYearlyChartDashboard(containerId, data) {
    const container = document.getElementById(containerId);
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const max = Math.max(...Object.values(data));
    
    if (max === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">データがありません</p>';
        return;
    }

    const html = months.map((month, i) => {
        const amount = data[i];
        const height = (amount / max) * 100;
        return `
            <div class="chart-bar">
                <div class="bar" style="height: ${height}%; min-height: 20px;" title="${month}: ¥${amount}">
                </div>
                <div class="bar-label">${month}</div>
                <div class="bar-value">¥${Math.round(amount)}</div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `<div class="chart">${html}</div>`;
}

// 年間表示
function updateYearly() {
    const year = manager.currentYearDate.getFullYear();
    const grouped = manager.groupByMonth(year);
    
    document.getElementById('yearLabel').textContent = `${year}年`;
    drawYearlyChart(grouped);
    updateYearlyTable(grouped);
}

document.getElementById('prevYear').addEventListener('click', () => {
    manager.currentYearDate.setFullYear(manager.currentYearDate.getFullYear() - 1);
    updateYearly();
});

document.getElementById('nextYear').addEventListener('click', () => {
    manager.currentYearDate.setFullYear(manager.currentYearDate.getFullYear() + 1);
    updateYearly();
});

// チャート描画
function drawChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (Object.keys(data).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">データがありません</p>';
        return;
    }

    const max = Math.max(...Object.values(data));
    const html = Object.entries(data)
        .map(([category, amount]) => {
            const height = (amount / max) * 100;
            return `
                <div class="chart-bar">
                    <div class="bar" style="height: ${height}%; min-height: 20px;" title="${category}: ¥${amount}">
                    </div>
                    <div class="bar-label">${category}</div>
                    <div class="bar-value">¥${Math.round(amount)}</div>
                </div>
            `;
        })
        .join('');
    
    container.innerHTML = `<div class="chart">${html}</div>`;
}

function drawYearlyChart(data) {
    const container = document.getElementById('yearlyChart');
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const max = Math.max(...Object.values(data));
    
    if (max === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">データがありません</p>';
        return;
    }

    const html = months.map((month, i) => {
        const amount = data[i];
        const height = (amount / max) * 100;
        return `
            <div class="chart-bar">
                <div class="bar" style="height: ${height}%; min-height: 20px;" title="${month}: ¥${amount}">
                </div>
                <div class="bar-label">${month}</div>
                <div class="bar-value">¥${Math.round(amount)}</div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `<div class="chart">${html}</div>`;
}

// テーブル更新
function updateTable(bodyId, grouped, expenses) {
    const tbody = document.getElementById(bodyId);
    const total = Object.values(grouped).reduce((a, b) => a + b, 0);
    
    tbody.innerHTML = Object.entries(grouped)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => {
            const percentage = ((amount / total) * 100).toFixed(1);
            return `
                <tr>
                    <td>${category}</td>
                    <td>¥${amount.toLocaleString('ja-JP')}</td>
                    <td>${percentage}%</td>
                </tr>
            `;
        })
        .join('');
    
    tbody.innerHTML += `
        <tr style="background: #f0f0f0; font-weight: bold;">
            <td>合計</td>
            <td>¥${total.toLocaleString('ja-JP')}</td>
            <td>100%</td>
        </tr>
    `;
}

function updateYearlyTable(data) {
    const tbody = document.getElementById('yearlyTableBody');
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    
    tbody.innerHTML = months.map((month, i) => {
        return `
            <tr>
                <td>${month}</td>
                <td>¥${Math.round(data[i]).toLocaleString('ja-JP')}</td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML += `
        <tr style="background: #f0f0f0; font-weight: bold;">
            <td>合計</td>
            <td>¥${Math.round(total).toLocaleString('ja-JP')}</td>
        </tr>
    `;
}

// ラベル更新
function updateLabel(id, date) {
    const start = manager.getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const startStr = `${start.getMonth() + 1}月${start.getDate()}日`;
    const endStr = `${end.getMonth() + 1}月${end.getDate()}日`;
    document.getElementById(id).textContent = `${startStr} ～ ${endStr}`;
}

function updateMonthLabel(id, date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    document.getElementById(id).textContent = `${year}年 ${month}月`;
}

// 初期表示
document.getElementById('date').valueAsDate = new Date();
updateExpenseList();

// レシートアップロード処理
const uploadArea = document.getElementById('uploadArea');
const receiptInput = document.getElementById('receiptImage');
const processingStatus = document.getElementById('processingStatus');
const receiptResults = document.getElementById('receiptResults');

let recognizedItems = [];

uploadArea.addEventListener('click', () => receiptInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleReceiptUpload(files[0]);
    }
});

receiptInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleReceiptUpload(e.target.files[0]);
    }
});

document.getElementById('addSelectedItems').addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('#receiptItemsList input[type="checkbox"]:checked');
    let addedCount = 0;
    
    checkboxes.forEach((checkbox) => {
        const itemIndex = parseInt(checkbox.dataset.index);
        const item = recognizedItems[itemIndex];
        manager.addExpense(
            document.getElementById('date').value,
            item.category,
            item.amount,
            item.name
        );
        addedCount++;
    });
    
    if (addedCount > 0) {
        alert(`${addedCount}件の支出を追加しました`);
        updateExpenseList();
        receiptResults.style.display = 'none';
        recognizedItems = [];
    }
});

document.getElementById('clearReceiptResults').addEventListener('click', () => {
    receiptResults.style.display = 'none';
    recognizedItems = [];
    receiptInput.value = '';
});

async function handleReceiptUpload(file) {
    if (!file.type.startsWith('image/')) {
        alert('画像ファイルをアップロードしてください');
        return;
    }

    processingStatus.style.display = 'block';
    receiptResults.style.display = 'none';
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = '10%';

    const reader = new FileReader();
    reader.onload = async (e) => {
        const image = e.target.result;
        
        try {
            progressFill.style.width = '30%';
            
            // Tesseract.jsを使用してOCR処理
            const { createWorker } = Tesseract;
            const worker = await createWorker('jpn');
            
            progressFill.style.width = '60%';
            
            const result = await worker.recognize(image);
            const text = result.data.text;
            
            progressFill.style.width = '80%';
            
            await worker.terminate();
            
            // テキストから商品と金額のペアを抽出
            recognizedItems = extractItems(text);
            
            progressFill.style.width = '100%';
            
            if (recognizedItems.length > 0) {
                displayRecognizedItems();
                receiptResults.style.display = 'block';
            } else {
                alert('商品情報を認識できませんでした');
            }
            
            setTimeout(() => {
                processingStatus.style.display = 'none';
                progressFill.style.width = '0%';
            }, 500);
            
        } catch (error) {
            console.error('OCR処理エラー:', error);
            processingStatus.style.display = 'none';
            alert('レシート認識に失敗しました。手動で入力してください。');
        }
    };
    
    reader.readAsDataURL(file);
}

function extractItems(text) {
    const items = [];
    const lines = text.split('\n');
    
    // 複数のパターンで商品と金額を抽出
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // パターン1: "商品名 ¥金額" または "商品名 金額円"
        const pattern1 = /(.+?)\s+¥?([\d,]+)\s*円?$/;
        const match1 = line.match(pattern1);
        
        if (match1 && match1[2]) {
            const name = match1[1].trim();
            const amount = parseInt(match1[2].replace(/,/g, ''));
            
            // 除外ワード（合計、小計など）
            if (!['合計', '小計', '消費税', '税'].some(word => name.includes(word)) && 
                name.length > 1 && amount > 0) {
                
                const category = guessCategory(name);
                items.push({
                    name: name.substring(0, 30),
                    amount: amount,
                    category: category
                });
            }
        }
    }
    
    // 重複排除
    const uniqueItems = [];
    const seen = new Set();
    
    items.forEach(item => {
        const key = `${item.name}_${item.amount}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueItems.push(item);
        }
    });
    
    return uniqueItems;
}

function displayRecognizedItems() {
    const tbody = document.getElementById('receiptItemsList');
    tbody.innerHTML = '';
    
    recognizedItems.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" data-index="${index}" checked></td>
            <td>${item.name}</td>
            <td>¥${item.amount.toLocaleString('ja-JP')}</td>
            <td>${item.category || 'その他'}</td>
        `;
        tbody.appendChild(row);
    });
    
    // 合計金額を表示
    const totalAmount = recognizedItems.reduce((sum, item) => sum + item.amount, 0);
    const totalRow = document.createElement('tr');
    totalRow.style.background = '#f0f0f0';
    totalRow.style.fontWeight = 'bold';
    totalRow.innerHTML = `
        <td></td>
        <td>合計</td>
        <td>¥${totalAmount.toLocaleString('ja-JP')}</td>
        <td></td>
    `;
    document.getElementById('receiptItemsList').appendChild(totalRow);
}

function guessCategory(text) {
    const categoryKeywords = {
        '食費': ['食', '飲食', 'レストラン', 'カフェ', 'スーパー', '弁当', '食堂'],
        '交通費': ['電車', 'バス', 'タクシー', 'ガソリン', 'JR', '駅', '航空'],
        '日用品': ['薬局', 'ドラッグストア', 'スーパー', 'コンビニ'],
        '衣類': ['洋服', '靴', 'ファッション', 'ショップ'],
        '医療費': ['病院', '診療所', 'クリニック', '薬局'],
        '娯楽': ['映画', 'シアター', 'ゲーム', 'エンタメ'],
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                return category;
            }
        }
    }
    return '';
}