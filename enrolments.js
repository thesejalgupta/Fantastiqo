const express = require('express');
const router = express.Router();
const Enrolment = require('../models/enrolment');
const authMiddleware = require('../middleware/auth');

// Get all enrolments (Admin only)
router.get('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const enrolments = await Enrolment.find().populate('learner course');
    res.json(enrolments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new enrolment (Admin only)
router.post('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const enrolment = new Enrolment(req.body);
    await enrolment.save();
    res.status(201).json(enrolment);
  } catch (err) {
    res.status(400).json({ message: 'Error creating enrolment' });
  }
});

// Update enrolment
router.put('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const enrolment = await Enrolment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!enrolment) return res.status(404).json({ message: 'Enrolment not found' });
    res.json(enrolment);
  } catch (err) {
    res.status(400).json({ message: 'Error updating enrolment' });
  }
});

// Delete enrolment
router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const enrolment = await Enrolment.findByIdAndDelete(req.params.id);
    if (!enrolment) return res.status(404).json({ message: 'Enrolment not found' });
    res.json({ message: 'Enrolment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;