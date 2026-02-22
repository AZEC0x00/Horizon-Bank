const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const path = require('path');
//путь к папке нашего фронтенда
const middlewares = jsonServer.defaults({
    static: path.join(__dirname, '../frontend')
});
const jwt = require('jsonwebtoken'); // fake JWT для нашей демонстрации
const express = require('express');

const SECRET_KEY = 'horizon_qa_secret';
const PORT = process.env.PORT || 3000; //  PORT  default  3000

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Имитация аутентификации и добавление поддельного JWT.
server.post('/login', (req, res) => {
    const { username, password } = req.body;
    const db = router.db;
    const user = db.get('users').find({ username, password }).value();

    if (user) {
        if (user.username === 'locked_out_user') {
            // Ошибка 1: locked_out_user отображает "Неверные учетные данные" вместо сообщения о блокировке.
            // На самом деле это просто API возвращает ошибку 401 вместо конкретной ошибки 403, указывающей на блокировку.
            // Мы обработаем эту строку на стороне клиента или здесь:
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ token, user: { id: user.id, username: user.username, name: user.name } });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Промежуточное ПО аутентификации для других маршрутов
server.use((req, res, next) => {
    if (req.path === '/login' || req.path === '/register') {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // добавить пользователя в запрос

        // Ошибка 3: функция performance_glitch_user имеет задержку 4-7 секунд.
        if (req.user.username === 'performance_glitch_user') {
            const delay = Math.floor(Math.random() * 3000) + 4000; // 4000-7000ms
            setTimeout(next, delay);
        } else {
            next();
        }
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// endpoint пользовательских профилей
server.get('/profile', (req, res) => {
    const db = router.db;
    const user = db.get('users').find({ id: req.user.id }).value();
    if (user) {
        res.status(200).json(user);
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// Custom transfer endpoint
server.post('/transfer', (req, res) => {
    const { fromAccountId, toAccountId, amount, description, isExternal } = req.body;
    const db = router.db;

    const fromAccount = db.get('accounts').find({ id: Number(fromAccountId) }).value();
    let toAccount = null;
    if (!isExternal) {
        toAccount = db.get('accounts').find({ id: Number(toAccountId) }).value();
    }

    if (!fromAccount) {
        return res.status(400).json({ error: 'Invalid source account' });
    }

    // Ошибка 5: Переводы на несуществующие внешние счета иногда проходят успешно.
    if (isExternal) {
        const randomSuccess = Math.random() > 0.5;
        if (randomSuccess) {
            // simulate success
        } else {
            return res.status(400).json({ error: 'External account not found' });
        }
    }

    // Ошибка 2: problem_user -> баланс отправителя не уменьшается
    if (req.user.username === 'problem_user') {
        // Мы НЕ уменьшаем баланс счета.
        if (toAccount) {
            db.get('accounts').find({ id: toAccount.id }).assign({ balance: toAccount.balance + Number(amount) }).write();
        }
    } else {
        // Normal logic
        db.get('accounts').find({ id: fromAccount.id }).assign({ balance: fromAccount.balance - Number(amount) }).write();
        if (toAccount) {
            db.get('accounts').find({ id: toAccount.id }).assign({ balance: toAccount.balance + Number(amount) }).write();
        }
    }

    // Добавить транзакцию
    const newTransaction = {
        id: Date.now(),
        accountId: fromAccount.id,
        date: new Date().toISOString().split('T')[0],
        description: description || `Transfer to ${toAccountId}`,
        amount: -Number(amount),
        balanceAfter: req.user.username === 'problem_user' ? fromAccount.balance : fromAccount.balance - Number(amount)
    };
    db.get('transactions').push(newTransaction).write();

    res.status(200).json({ message: 'Transfer successful', transaction: newTransaction });
});

// Custom billpay endpoint
server.post('/billpay', (req, res) => {
    // Defect 4: error_user -> 50% chance of 500
    if (req.user.username === 'error_user' && Math.random() < 0.5) {
        return res.status(500).json({ error: 'Internal Server Error (Simulated)' });
    }

    const { fromAccountId, payeeId, amount, date } = req.body;
    const db = router.db;

    const fromAccount = db.get('accounts').find({ id: Number(fromAccountId) }).value();
    if (!fromAccount) {
        return res.status(400).json({ error: 'Invalid account' });
    }

    // Ошибка 6: Кредитная карта допускает отрицательный баланс ниже лимита без ошибки
    if (fromAccount.type !== 'Credit Card') {
        if (fromAccount.balance < Number(amount)) {
            // Обычно при использовании расчетных/сберегательных счетов используется проверка средств, но мы не будем строго блокировать этот процесс.,
            // Или, может быть, будем?:
            return res.status(400).json({ error: 'Insufficient funds' });
        }
    }

    db.get('accounts').find({ id: fromAccount.id }).assign({ balance: fromAccount.balance - Number(amount) }).write();

    // Создать транзакцию
    const payee = db.get('payees').find({ id: Number(payeeId) }).value();
    const payeeName = payee ? payee.name : 'Unknown Payee';

    const newTransaction = {
        id: Date.now(),
        accountId: fromAccount.id,
        date: date || new Date().toISOString().split('T')[0],
        description: `Bill Payment: ${payeeName}`,
        amount: -Number(amount),
        balanceAfter: fromAccount.balance - Number(amount)
    };

    db.get('transactions').push(newTransaction).write();

    res.status(200).json({ message: 'Bill paid successfully', transaction: newTransaction });
});

server.post('/logout', (req, res) => {
    // Здесь размещается логика выхода из системы (аннулирование токена при использовании только JWT — сложная задача, поэтому мы просто возвращаем успешный результат).
    res.status(200).json({ message: 'Logged out successfully' });
});

// Rewrite /accounts to filter by user and fix the json-server schema
server.get('/accounts', (req, res, next) => {
    const db = router.db;
    const userAccounts = db.get('accounts').filter({ userId: req.user.id }).value();
    res.status(200).json(userAccounts);
});

// Rewrite /transactions?accountId to only allow if account belongs to user
server.use(router);

server.listen(PORT, () => {
    console.log(`Horizon Bank API is running on port ${PORT}`);
});
