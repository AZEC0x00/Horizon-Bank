// frontend/js/api.js
const API_BASE = ''; // Empty string means it will use the current domain (works locally and on Render)

const api = {
    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
    },

    async login(username, password) {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return response;
    },

    async getProfile() {
        const response = await fetch(`${API_BASE}/profile`, {
            headers: this.getAuthHeaders()
        });
        return response;
    },

    async getAccounts() {
        const response = await fetch(`${API_BASE}/accounts`, {
            headers: this.getAuthHeaders()
        });
        return response;
    },

    async getTransactions() {
        const response = await fetch(`${API_BASE}/transactions`, {
            headers: this.getAuthHeaders()
        });
        return response;
    },

    async transfer(data) {
        const response = await fetch(`${API_BASE}/transfer`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return response;
    },

    async billPay(data) {
        const response = await fetch(`${API_BASE}/billpay`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return response;
    },

    logout() {
        // Calling backend logout isn't strictly necessary for our fake JWT, but we'll do it
        fetch(`${API_BASE}/logout`, { method: 'POST' }).catch(() => { });

        const user = JSON.parse(localStorage.getItem('user'));
        // Defect 10: Logout does not completely clear session/localStorage (basket/transactions remains)
        // We only remove token, but leave the 'transactions' or 'user' partly if defect is active
        // Let's just remove token and user
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/index.html';
    }
};
