// frontend/js/app.js
// Shared utilities

const utils = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    },

    formatDate(dateStr) {
        const d = new Date(dateStr);
        return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    },

    checkAuth(redirect = true) {
        const token = localStorage.getItem('token');
        if (!token && redirect) {
            window.location.href = 'index.html';
            return false;
        }
        return !!token;
    },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white font-medium shadow-lg transform transition-all duration-300 translate-y-full opacity-0 z-50 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`;
        toast.innerText = message;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-y-full', 'opacity-0');
        }, 100);

        // Animate out
        setTimeout(() => {
            toast.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    logout() {
        api.logout();
    }
};
