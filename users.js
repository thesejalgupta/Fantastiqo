const express = require('express');
const router = express.Router();
const User = require('../models/user');
const authMiddleware = require('../middleware/auth');

// Get current user
router.get('/me', authMiddleware(['admin', 'instructor', 'learner']), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (Admin only)
router.get('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all instructors (Admin only)
router.get('/instructors', authMiddleware(['admin']), async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor' });
    res.json(instructors.map(i => ({
      id: i._id,
      title: i.name,
      image: i.avatar || 'default-avatar.png',
      description: i.bio,
      quickAction: 'Approve Instructor'
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all learners (Admin or Instructor)
router.get('/learners', authMiddleware(['admin', 'instructor']), async (req, res) => {
  try {
    const learners = await User.find({ role: 'learner' });
    res.json(learners.map(l => ({
      id: l._id,
      title: l.name,
      image: l.avatar || 'default-avatar.png',
      description: l.email,
      quickAction: 'Add Learner'
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve instructor (Admin only)
router.post('/instructors/approve/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!user) return res.status(404).json({ message: 'Instructor not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: 'Error approving instructor' });
  }
});

// Create new instructor (Admin only)
router.post('/instructors', authMiddleware(['admin']), async (req, res) => {
  try {
    const { name, email, password, bio, specialty } = req.body;
    const user = new User({ name, email, password, role: 'instructor', bio, specialty });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: 'Error creating instructor' });
  }
});

// Create new learner (Admin or Instructor)
router.post('/learners', authMiddleware(['admin', 'instructor']), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = new User({ name, email, password, role: 'learner' });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: 'Error creating learner' });
  }
});

// Update user
router.put('/:id', authMiddleware(['admin', 'instructor', 'learner']), async (req, res) => {
  try {
    const updates = req.body;
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: 'Error updating user' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;