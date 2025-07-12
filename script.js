class ExpenseTracker {
    constructor() {
        this.transactions = [];
        this.init();
    }

    init() {
        this.loadTransactions();
        this.bindEvents();
        this.updateDisplay();
        this.renderChart();
    }

    bindEvents() {
        const form = document.getElementById('expense-form');
        const clearAllBtn = document.getElementById('clear-all');

        form.addEventListener('submit', (e) => this.handleSubmit(e));
        clearAllBtn.addEventListener('click', () => this.clearAllTransactions());
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const description = document.getElementById('description').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;

        if (!description || isNaN(amount) || amount === 0 || !category) {
            this.showError('Please fill in all fields with valid values');
            return;
        }

        const transaction = {
            id: Date.now(),
            description,
            amount: category === 'Income' ? Math.abs(amount) : -Math.abs(amount),
            category,
            date: new Date().toISOString()
        };

        this.addTransaction(transaction);
        this.clearForm();
    }

    addTransaction(transaction) {
        this.transactions.unshift(transaction);
        this.saveTransactions();
        this.updateDisplay();
        this.renderChart();
        this.showSuccess('Transaction added successfully');
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTransactions();
        this.updateDisplay();
        this.renderChart();
        this.showSuccess('Transaction deleted successfully');
    }

    clearAllTransactions() {
        if (this.transactions.length === 0) {
            this.showError('No transactions to clear');
            return;
        }

        if (confirm('Are you sure you want to delete all transactions?')) {
            this.transactions = [];
            this.saveTransactions();
            this.updateDisplay();
            this.renderChart();
            this.showSuccess('All transactions cleared');
        }
    }

    updateDisplay() {
        this.updateBalance();
        this.updateSummary();
        this.renderTransactionList();
    }

    updateBalance() {
        const balance = this.transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        document.getElementById('balance').textContent = this.formatCurrency(balance);
    }

    updateSummary() {
        const income = this.transactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = this.transactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        document.getElementById('total-income').textContent = this.formatCurrency(income);
        document.getElementById('total-expenses').textContent = this.formatCurrency(expenses);
    }

    renderTransactionList() {
        const list = document.getElementById('transaction-list');
        list.innerHTML = '';

        if (this.transactions.length === 0) {
            list.innerHTML = '<li class="no-data">No transactions yet. Add your first transaction above!</li>';
            return;
        }

        this.transactions.forEach(transaction => {
            const li = document.createElement('li');
            li.className = `transaction-item ${transaction.amount > 0 ? 'income' : 'expense'}`;
            
            li.innerHTML = `
                <div class="transaction-details">
                    <div class="transaction-description">${this.escapeHtml(transaction.description)}</div>
                    <div class="transaction-category">${transaction.category} • ${this.formatDate(transaction.date)}</div>
                </div>
                <div class="transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}">
                    ${this.formatCurrency(transaction.amount)}
                </div>
                <button class="delete-btn" onclick="expenseTracker.deleteTransaction(${transaction.id})">
                    Delete
                </button>
            `;
            
            list.appendChild(li);
        });
    }

    renderChart() {
        const canvas = document.getElementById('expenseChart');
        const ctx = canvas.getContext('2d');
        
      
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

       
        const expenseTransactions = this.transactions.filter(t => t.amount < 0);
        
        if (expenseTransactions.length === 0) {
            ctx.fillStyle = '#7f8c8d';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No expense data to display', canvas.width / 2, canvas.height / 2);
            return;
        }

        
        const categoryTotals = {};
        expenseTransactions.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
        });

        const sortedCategories = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a);

        const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
        
       
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 60;
        
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c',
            '#4facfe', '#00f2fe', '#a8edea', '#fed6e3'
        ];

        let currentAngle = -Math.PI / 2;
        
        sortedCategories.forEach(([category, amount], index) => {
            const sliceAngle = (amount / total) * 2 * Math.PI;
            const color = colors[index % colors.length];
            
          
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.fillStyle = color;
            ctx.fill();
            
           
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
            
            ctx.fillStyle = '#2c3e50';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(category, labelX, labelY);
            ctx.fillText(this.formatCurrency(amount), labelX, labelY + 15);
            
            currentAngle += sliceAngle;
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    clearForm() {
        document.getElementById('description').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('category').value = '';
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
       
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            ${type === 'success' ? 'background: #00b894;' : 'background: #e74c3c;'}
        `;

        document.body.appendChild(notification);

       
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

     
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    saveTransactions() {
    try {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        console.log('Transactions saved:', this.transactions);
    } catch (error) {
        console.log('Error saving to localStorage:', error);
    }
}

loadTransactions() {
    try {
        const data = localStorage.getItem('transactions');
        this.transactions = data ? JSON.parse(data) : [];
        console.log('Transactions loaded:', this.transactions);
    } catch (error) {
        this.transactions = [];
        console.log('No saved data found');
    }
}

}

let expenseTracker;
document.addEventListener('DOMContentLoaded', () => {
    expenseTracker = new ExpenseTracker();
});

function addTransaction() {
   
    if (expenseTracker) {
        const form = document.getElementById('expense-form');
        const event = new Event('submit');
        form.dispatchEvent(event);
    }
}
