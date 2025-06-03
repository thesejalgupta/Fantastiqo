const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./db'); // Import connectDB

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Schemas
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String, default: '/api/placeholder/40/40' },
  role: { type: String, enum: ['admin', 'instructor', 'learner'], default: 'learner' },
  createdAt: { type: Date, default: Date.now }
});

const learnerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  progress: [{ courseId: mongoose.Schema.Types.ObjectId, completion: Number }],
  createdAt: { type: Date, default: Date.now }
});

const instructorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  createdAt: { type: Date, default: Date.now }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, default: '/api/placeholder/320/180' },
  type: { type: String, enum: ['recorded', 'group', 'one-on-one'], required: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor' },
  price: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  icon: { type: String, default: 'fas fa-bell' },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Learner = mongoose.model('Learner', learnerSchema);
const Instructor = mongoose.model('Instructor', instructorSchema);
const Course = mongoose.model('Course', courseSchema);
const Notification = mongoose.model('Notification', notificationSchema);

// Middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminMiddleware = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  req.user.role = user.role;
  next();
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name, role });
    await user.save();

    if (role === 'learner') {
      const learner = new Learner({ userId: user._id });
      await learner.save();
    } else if (role === 'instructor') {
      const instructor = new Instructor({ userId: user._id });
      await instructor.save();
    }

    // Notify admins of new user
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      const notification = new Notification({
        message: `New ${role} registered: ${name}`,
        recipientId: admin._id,
        icon: 'fas fa-user-plus'
      });
      await notification.save();
    }

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, avatar: user.avatar, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// User Profile
app.get('/api/users/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalLearners = await Learner.countDocuments();
    const activeInstructors = await Instructor.countDocuments({ status: 'approved' });
    const totalCourses = await Course.countDocuments();
    const revenue = await Course.aggregate([
      { $match: {} },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    const stats = [
      { id: 1, title: 'Total Learners', value: totalLearners, icon: 'fas fa-graduation-cap', trend: 'up' },
      { id: 2, title: 'Active Instructors', value: activeInstructors, icon: 'fas fa-chalkboard-teacher', trend: 'up' },
      { id: 3, title: 'Courses', value: totalCourses, icon: 'fas fa-book', trend: 'down' },
      { id: 4, title: 'Revenue', value: `$${revenue[0]?.total || 0}`, icon: 'fas fa-dollar-sign', trend: 'up' }
    ];

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Analytics Chart
app.get('/api/dashboard/chart', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const learnerGrowth = await Learner.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 5 }
    ]);

    const chartData = {
      labels: learnerGrowth.map(item => item._id),
      datasets: [{
        label: 'Learner Growth',
        data: learnerGrowth.map(item => item.count),
        backgroundColor: 'rgba(0, 123, 255, 0.2)',
        borderColor: 'rgba(0, 123, 255, 1)',
        borderWidth: 2
      }]
    };

    res.json(chartData);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Management: Learners
app.get('/api/learners', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const learners = await Learner.find().populate('userId', 'name email');
    res.json(learners.map(learner => ({
      id: learner._id,
      title: `Learner: ${learner.userId.name}`,
      image: learner.userId.avatar,
      description: `Progress: ${learner.progress.length} courses`,
      quickAction: 'Add Learner'
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/learners', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { email, name } = req.body;
    const user = new User({
      email,
      name,
      password: await bcrypt.hash('default123', 10),
      role: 'learner'
    });
    await user.save();
    const learner = new Learner({ userId: user._id });
    await learner.save();
    res.status(201).json({ message: 'Learner added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Management: Instructors
app.get('/api/instructors', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const instructors = await Instructor.find().populate('userId', 'name email');
    res.json(instructors.map(instructor => ({
      id: instructor._id,
      title: `Instructor: ${instructor.userId.name}`,
      image: instructor.userId.avatar,
      description: `Status: ${instructor.status}`,
      quickAction: 'Approve Instructor'
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/instructors/approve/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) return res.status(404).json({ message: 'Instructor not found' });
    instructor.status = 'approved';
    await instructor.save();
    res.json({ message: 'Instructor approved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Management: Courses
app.get('/api/courses', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const courses = await Course.find().populate('instructorId', 'userId');
    res.json(courses.map(course => ({
      id: course._id,
      title: course.title,
      image: course.image,
      description: course.description,
      quickAction: 'Add Course'
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/courses', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, type, instructorId, price } = req.body;
    const course = new Course({ title, description, type, instructorId, price });
    await course.save();
    res.status(201).json({ message: 'Course added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Notifications
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user.id }).sort({ createdAt: -1 }).limit(10);
    res.json(notifications.map(notification => ({
      id: notification._id,
      message: notification.message,
      icon: notification.icon
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/notifications', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { message, recipientId, icon } = req.body;
    const notification = new Notification({
      message,
      recipientId,
      icon: icon || 'fas fa-bell'
    });
    await notification.save();
    res.status(201).json({ message: 'Notification created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Stub APIs for Other Pages
app.get('/api/recorded-courses', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const courses = await Course.find({ type: 'recorded' });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/group-courses', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const courses = await Course.find({ type: 'group' });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/one-on-one-courses', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const courses = await Course.find({ type: 'one-on-one' });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/chats', authMiddleware, adminMiddleware, async (req, res) => {
  res.json({ message: 'Chats endpoint (TBD)' });
});

app.get('/api/store', authMiddleware, adminMiddleware, async (req, res) => {
  res.json({ message: 'Store endpoint (TBD)' });
});

app.get('/api/analytics', authMiddleware, adminMiddleware, async (req, res) => {
  res.json({ message: 'Analytics endpoint (TBD)' });
});

app.get('/api/finance', authMiddleware, adminMiddleware, async (req, res) => {
  res.json({ message: 'Finance endpoint (TBD)' });
});

app.get('/api/settings', authMiddleware, adminMiddleware, async (req, res) => {
  res.json({ message: 'Settings endpoint (TBD)' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));