// ------------------------------
// PocketPulse JS - Clean & Safe
// ------------------------------

const BASE_URL = "http://localhost:4000"; // backend root

// Form & DOM elements
const form = document.getElementById('txForm');
const txType = document.getElementById('txType');
const txAmount = document.getElementById('txAmount');
const txCategory = document.getElementById('txCategory');
const txDate = document.getElementById('txDate');
const txDesc = document.getElementById('txDesc');

const viewDate = document.getElementById('viewDate');
const dailyIncomeEl = document.getElementById('dailyIncome');
const dailyExpenseEl = document.getElementById('dailyExpense');
const dailyBalanceEl = document.getElementById('dailyBalance');
const monthBalanceEl = document.getElementById('monthBalance');
const lifetimeBalanceEl = document.getElementById('lifetimeBalance');
const txTableBody = document.getElementById('txTableBody');

const filterType = document.getElementById('filterType');
const searchText = document.getElementById('searchText');
const seedDemo = document.getElementById('seedDemo');

let chart = null;

// ------------------------------
// Initialize
// ------------------------------
function todayISO() { return new Date().toISOString().slice(0, 10); }
txDate.value = todayISO();
viewDate.value = todayISO();

form.addEventListener('submit', submitTransaction);
viewDate.addEventListener('change', renderAll);
filterType.addEventListener('change', renderAll);
searchText.addEventListener('input', renderAll);
seedDemo.addEventListener('click', seedDemoData);

renderAll();

// ------------------------------
// API calls with fallback
// ------------------------------
async function fetchTransactions(date) {
    try {
        const url = date ? `${BASE_URL}/transactions?date=${date}` : `${BASE_URL}/transactions`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error("Error fetching transactions:", e);
        return [];
    }
}

async function addTransactionToDB(tx) {
    try {
        const res = await fetch(`${BASE_URL}/transactions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tx)
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error("Error adding transaction:", e);
        return null;
    }
}

async function deleteTransactionDB(id) {
    try {
        const res = await fetch(`${BASE_URL}/transactions/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error("Error deleting transaction:", e);
        return null;
    }
}

async function fetchSummary(date) {
    try {
        const res = await fetch(`${BASE_URL}/summary?date=${date}`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error("Error fetching summary:", e);
        // fallback to empty summary
        return {
            daily: { income: 0, expense: 0, balance: 0 },
            month: { balance: 0 },
            lifetime: { balance: 0 }
        };
    }
}

// ------------------------------
// Form submission
// ------------------------------
async function submitTransaction(e) {
    e.preventDefault();
    const amount = parseFloat(txAmount.value);
    if (isNaN(amount) || amount <= 0) return alert('Enter a valid amount > 0');

    const tx = {
        type: txType.value,
        amount,
        category: txCategory.value || (txType.value === 'income' ? 'Income' : 'Expense'),
        date: txDate.value,
        description: txDesc.value || ''
    };

    const result = await addTransactionToDB(tx);
    if (result && result.id) {
        form.reset();
        txDate.value = todayISO();
        renderAll();
    } else {
        alert("Failed to add transaction");
    }
}

// ------------------------------
// Delete transaction
// ------------------------------
async function deleteTx(id) {
    if (!confirm('Delete this transaction?')) return;
    const result = await deleteTransactionDB(id);
    if (result && result.ok) renderAll();
}

// ------------------------------
// Render & calculations
// ------------------------------
async function renderAll() {
    const date = viewDate.value;
    const transactions = await fetchTransactions();
    renderTable(transactions);
    const summary = await fetchSummary(date);
    renderSummary(summary);
    renderChart(transactions);
}

function renderSummary(summary) {
    if (!summary) return;
    dailyIncomeEl.textContent = formatCurrency(summary.daily.income);
    dailyExpenseEl.textContent = formatCurrency(summary.daily.expense);
    dailyBalanceEl.textContent = formatCurrency(summary.daily.balance);
    monthBalanceEl.textContent = formatCurrency(summary.month.balance);
    lifetimeBalanceEl.textContent = formatCurrency(summary.lifetime.balance);
}

function renderTable(transactions) {
    const q = searchText.value.trim().toLowerCase();
    const typeFilterVal = filterType.value;
    const sorted = [...transactions].sort(
  (a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if(dateCompare !== 0) return dateCompare;
    return b.id - a.id; // numeric comparison
  }
);
    const rows = sorted.filter(t => {
        if (typeFilterVal !== 'all' && t.type !== typeFilterVal) return false;
        if (q) return (t.description + ' ' + t.category).toLowerCase().includes(q);
        return true;
    }).map(t => {
        return `<tr>
            <td>${t.date}</td>
            <td>${t.type === 'income' ? 'Income' : 'Expense'}</td>
            <td>${escapeHtml(t.category)} ${t.description ? '<div class="muted" style="font-size:12px">' + escapeHtml(t.description) + '</div>' : ''}</td>
            <td style="font-weight:600">${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}</td>
            <td><button class="small-btn delete" onclick="deleteTx('${t.id}')">Delete</button></td>
        </tr>`;
    }).join('');
    txTableBody.innerHTML = rows || '<tr><td colspan="5" class="muted">No transactions yet.</td></tr>';
}

// ------------------------------
// Chart
// ------------------------------
function renderChart(transactions) {
    const selected = viewDate.value;
    const end = new Date(selected);
    const labels = [], incomeData = [], expenseData = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(end);
        d.setDate(end.getDate() - i);
        const iso = d.toISOString().slice(0, 10);
        labels.push(iso);

        const dayTx = transactions.filter(t => t.date === iso);
        const incomes = dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        incomeData.push(Math.round(incomes * 100) / 100);
        expenseData.push(Math.round(expenses * 100) / 100);
    }

    const ctx = document.getElementById('historyChart').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Income', data: incomeData, tension: 0.3, fill: false, borderWidth: 2 }, { label: 'Expense', data: expenseData, tension: 0.3, fill: false, borderWidth: 2 }] },
        options: { interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
    });
}

// ------------------------------
// Helpers
// ------------------------------
function formatCurrency(n) {
    try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n); }
    catch (e) { return '₹' + Number(n).toFixed(2); }
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ------------------------------
// Demo data
// ------------------------------
async function seedDemoData() {
    const sample = [
        { type: 'income', amount: 5000, category: 'Salary', date: todayISO(), description: 'October salary' },
        { type: 'expense', amount: 120, category: 'Food', date: todayISO(), description: 'Lunch' },
        { type: 'expense', amount: 350, category: 'Groceries', date: todayISO(), description: 'Vegetables' },
        { type: 'expense', amount: 200, category: 'Transport', date: addDays(todayISO(), -1), description: 'Taxi' },
        { type: 'income', amount: 1500, category: 'Freelance', date: addDays(todayISO(), -2), description: 'Project part' }
    ];

    for (const tx of sample) {
        await addTransactionToDB(tx);
    }
    renderAll();
}

function addDays(iso, days) {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

// Expose deleteTx globally
window.deleteTx = deleteTx;

