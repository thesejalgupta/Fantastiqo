const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction');
const authMiddleware = require('../middleware/auth');

// Get all transactions (Admin only)
router.get('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('user course');
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new transaction (Admin only)
router.post('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ message: 'Error creating transaction' });
  }
});

// Schedule instructor payout (Admin only)
router.post('/payout', authMiddleware(['admin']), async (req, res) => {
  try {
    const transaction = new Transaction({ ...req.body, type: 'payout' });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ message: 'Error scheduling payout' });
  }
});

// Update transaction
router.put('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: 'Error updating transaction' });
  }
});

// Delete transaction
router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;