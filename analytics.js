const express = require('express');
const router = express.Router();
const Enrolment = require('../models/enrolment');
const Transaction = require('../models/transaction');
const User = require('../models/user');
const Course = require('../models/course');
const authMiddleware = require('../middleware/auth');

// Get dashboard stats (Admin only)
router.get('/stats', authMiddleware(['admin']), async (req, res) => {
  try {
    const totalEnrolments = await Enrolment.countDocuments();
    const totalRevenue = await Transaction.aggregate([
      { $match: { type: 'sale', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const activeUsers = await User.countDocuments({ role: { $in: ['instructor', 'learner'] } });
    const totalCourses = await Course.countDocuments();

    res.json([
      { title: 'Total Enrolments', value: totalEnrolments, icon: 'fas fa-users', trend: 'up' },
      { title: 'Total Revenue', value: `$${totalRevenue[0]?.total || 0}`, icon: 'fas fa-dollar-sign', trend: 'up' },
      { title: 'Active Users', value: activeUsers, icon: 'fas fa-user-check', trend: 'up' },
      { title: 'Total Courses', value: totalCourses, icon: 'fas fa-book', trend: 'up' }
    ]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get enrolment trend
router.get('/enrolment-trend', authMiddleware(['admin', 'instructor']), async (req, res) => {
  try {
    const query = req.user.role === 'instructor' ? { instructor: req.user.id } : {};
    const trend = await Enrolment.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$enrolledAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json({ labels: trend.map(t => t._id), data: trend.map(t => t.count) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get revenue breakdown
router.get('/revenue-breakdown', authMiddleware(['admin', 'instructor']), async (req, res) => {
  try {
    const query = req.user.role === 'instructor' ? { user: req.user.id } : {};
    const breakdown = await Transaction.aggregate([
      { $match: { ...query, type: 'sale', status: 'completed' } },
      {
        $group: {
          _id: '$course',
          total: { $sum: '$amount' }
        }
      },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } }
    ]);
    res.json(breakdown);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user demographics
router.get('/user-demographics', authMiddleware(['admin', 'instructor']), async (req, res) => {
  try {
    const demographics = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(demographics);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get learner performance (Instructor only)
router.get('/learner-performance', authMiddleware(['instructor']), async (req, res) => {
  try {
    const performance = await Grade.aggregate([
      { $match: { course: { $in: await Course.find({ instructor: req.user.id }).select('_id') } } },
      {
        $group: {
          _id: '$learner',
          averageGrade: { $avg: '$grade' },
          totalAssignments: { $sum: 1 }
        }
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'learner' } }
    ]);
    res.json(performance);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course completion rate (Instructor only)
router.get('/completion-rate', authMiddleware(['instructor']), async (req, res) => {
  try {
    const completion = await Enrolment.aggregate([
      { $match: { course: { $in: await Course.find({ instructor: req.user.id }).select('_id') } } },
      {
        $group: {
          _id: '$course',
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          total: { $sum: 1 }
        }
      },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } }
    ]);
    res.json(completion.map(c => ({
      course: c.course[0]?.title,
      completionRate: (c.completed / c.total) * 100
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chart data for admin dashboard
router.get('/chart', authMiddleware(['admin']), async (req, res) => {
  try {
    const trend = await Enrolment.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$enrolledAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json({
      labels: trend.map(t => t._id),
      datasets: [{
        label: 'Enrolments',
        data: trend.map(t => t.count),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        fill: true
      }]
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;