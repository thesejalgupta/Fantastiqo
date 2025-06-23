const express = require('express');
const router = express.Router();
const Setting = require('../models/setting');
const authMiddleware = require('../middleware/auth');

// Get platform settings (Admin only)
router.get('/platform', authMiddleware(['admin']), async (req, res) => {
  try {
    const settings = await Setting.findOne({ user: null });
    res.json(settings || {});
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update platform settings (Admin only)
router.put('/platform', authMiddleware(['admin']), async (req, res) => {
  try {
    const settings = await Setting.findOneAndUpdate({ user: null }, req.body, { new: true, upsert: true });
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: 'Error updating settings' });
  }
});

// Get user settings
router.get('/user', authMiddleware(['admin', 'instructor', 'learner']), async (req, res) => {
  try {
    const settings = await Setting.findOne({ user: req.user.id });
    res.json(settings || {});
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user settings
router.put('/user', authMiddleware(['admin', 'instructor', 'learner']), async (req, res) => {
  try {
    const settings = await Setting.findOneAndUpdate({ user: req.user.id }, req.body, { new: true, upsert: true });
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: 'Error updating settings' });
  }
});

module.exports = router;