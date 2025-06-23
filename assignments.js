const express = require('express');
const router = express.Router();
const Assignment = require('../models/assignment');
const authMiddleware = require('../middleware/auth');

// Get all assignments (Instructor or Learner)
router.get('/', authMiddleware(['instructor', 'learner']), async (req, res) => {
  try {
    const query = req.user.role === 'learner' ? { learner: req.user.id } : {};
    const assignments = await Assignment.find(query).populate('course learner');
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new assignment (Instructor only)
router.post('/', authMiddleware(['instructor']), async (req, res) => {
  try {
    const assignment = new Assignment({ ...req.body, instructor: req.user.id });
    await assignment.save();
    res.status(201).json(assignment);
  } catch (err) {
    res.status(400).json({ message: 'Error creating assignment' });
  }
});

// Update assignment
router.put('/:id', authMiddleware(['instructor']), async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json(assignment);
  } catch (err) {
    res.status(400).json({ message: 'Error updating assignment' });
  }
});

// Delete assignment
router.delete('/:id', authMiddleware(['instructor']), async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;