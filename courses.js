const express = require('express');
const router = express.Router();
const Course = require('../models/course');
const authMiddleware = require('../middleware/auth');

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().populate('instructor category').lean();
    res.json(courses.map(c => ({
      id: c._id,
      title: c.title,
      image: c.image || 'default-course.png',
      description: c.description,
      quickAction: 'Add Course'
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get courses by type (recorded, group, one_on_one)
router.get('/type/:courseType', async (req, res) => {
  try {
    const courses = await Course.find({ courseType: req.params.courseType }).populate('instructor category');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new course (Admin or Instructor)
router.post('/', authMiddleware(['admin', 'instructor']), async (req, res) => {
  try {
    const course = new Course({ ...req.body, instructor: req.user.id });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ message: 'Error creating course' });
  }
});

// Update course
router.put('/:id', authMiddleware(['admin', 'instructor']), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(400).json({ message: 'Error updating course' });
  }
});

// Delete course
router.delete('/:id', authMiddleware(['admin', 'instructor']), async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;