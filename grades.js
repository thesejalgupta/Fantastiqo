const express = require('express');
const router = express.Router();
const Grade = require('../models/grade');
const authMiddleware = require('../middleware/auth');

// Get all grades (Instructor or Learner)
router.get('/', authMiddleware(['instructor', 'learner']), async (req, res) => {
  try {
    const query = req.user.role === 'learner' ? { learner: req.user.id } : {};
    const grades = await Grade.find(query).populate('assignment course learner');
    res.json(grades);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new grade (Instructor only)
router.post('/', authMiddleware(['instructor']), async (req, res) => {
  try {
    const grade = new Grade(req.body);
    await grade.save();
    res.status(201).json(grade);
  } catch (err) {
    res.status(400).json({ message: 'Error creating grade' });
  }
});

// Update grade
router.put('/:id', authMiddleware(['instructor']), async (req, res) => {
  try {
    const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    res.json(grade);
  } catch (err) {
    res.status(400).json({ message: 'Error updating grade' });
  }
});

// Delete grade
router.delete('/:id', authMiddleware(['instructor']), async (req, res) => {
  try {
    const grade = await Grade.findByIdAndDelete(req.params.id);
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    res.json({ message: 'Grade deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;