const express = require('express');
const router = express.Router();
const Notification = require('../models/notification');
const authMiddleware = require('../middleware/auth');

// Get all notifications for a user
router.get('/', authMiddleware(['admin', 'instructor', 'learner']), async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new notification
router.post('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    res.status(400).json({ message: 'Error creating notification' });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware(['admin', 'instructor', 'learner']), async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(400).json({ message: 'Error updating notification' });
  }
});

module.exports = router;