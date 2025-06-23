const express = require('express');
const router = express.Router();
const Activity = require('../models/activity');
const authMiddleware = require('../middleware/auth');

// Get all activities (Admin or Instructor)
router.get('/', authMiddleware(['admin', 'instructor']), async (req, res) => {
  try {
    const activities = await Activity.find().populate('user');
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new activity
router.post('/', authMiddleware(['admin', 'instructor']), async (req, res) => {
  try {
    const activity = new Activity(req.body);
    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    res.status(400).json({ message: 'Error creating activity' });
  }
});

module.exports = router;