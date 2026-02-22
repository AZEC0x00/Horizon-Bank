const fs = require('fs');

const users = [
  { id: 1, username: "standard_user", password: "horizon123!", name: "Standard User" },
  { id: 2, username: "locked_out_user", password: "horizon123!", name: "Locked User" },
  { id: 3, username: "problem_user", password: "horizon123!", name: "Problem User" },
  { id: 4, username: "performance_glitch_user", password: "horizon123!", name: "Glitch User" },
  { id: 5, username: "error_user", password: "horizon123!", name: "Error User" },
  { id: 6, username: "visual_user", password: "horizon123!", name: "Visual User" }
];

const accounts = [];
const transactions = [];

let accountIdCounter = 10000;
let transactionIdCounter = 1;

users.forEach(user => {
  const checkingId = user.id === 1 ? 12345 : accountIdCounter++;
  const savingsId = user.id === 1 ? 67890 : accountIdCounter++;
  const ccId = user.id === 1 ? 11122 : accountIdCounter++;

  accounts.push({ id: checkingId, userId: user.id, type: "Checking Account", balance: 1245.67 });
  accounts.push({ id: savingsId, userId: user.id, type: "Savings Account", balance: 8750.00 });
  accounts.push({ id: ccId, userId: user.id, type: "Credit Card", balance: -234.56, limit: 5000 });

  // Generate some transactions for Checking
  for (let i = 0; i < 7; i++) {
    transactions.push({
      id: transactionIdCounter++,
      accountId: checkingId,
      date: new Date(Date.now() - i * 86400000 * 2).toISOString().split('T')[0],
      description: i % 2 === 0 ? "Deposit" : "Grocery Store",
      amount: i % 2 === 0 ? 500.00 : -120.50,
      balanceAfter: 1245.67 - (i * 10) // Just fake balance
    });
  }

  // Generate some transactions for Savings
  for (let i = 0; i < 5; i++) {
    transactions.push({
      id: transactionIdCounter++,
      accountId: savingsId,
      date: new Date(Date.now() - i * 86400000 * 5).toISOString().split('T')[0],
      description: "Interest Payment",
      amount: 45.00,
      balanceAfter: 8750.00 - (i * 10)
    });
  }

  // Generate some transactions for CC
  for (let i = 0; i < 5; i++) {
    transactions.push({
      id: transactionIdCounter++,
      accountId: ccId,
      date: new Date(Date.now() - i * 86400000 * 3).toISOString().split('T')[0],
      description: "Online Shopping",
      amount: -54.99,
      balanceAfter: -234.56 + (i * 10)
    });
  }
});

const payees = [
  { id: 1, name: "Electricity" },
  { id: 2, name: "Internet" },
  { id: 3, name: "Rent" },
  { id: 4, name: "Phone" },
  { id: 5, name: "Water" }
];

const db = {
  users,
  accounts,
  transactions,
  payees
};

fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
console.log('db.json generated successfully.');
