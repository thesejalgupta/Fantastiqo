const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const validator = require('validator'); // For input validation
const app = express();
const port = 3000;
const secret = 'your-secret-key'; // Store securely in .env for production

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend files from public folder
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// In-memory data store (replace with MongoDB in production)
let data = {
  admin: {
    name: 'Admin User',
    email: 'admin@fantastiqo.com',
    avatar: '/api/placeholder/40/40',
  },
  settings: {
    siteName: 'Fantastiqo',
    siteLogo: '/api/placeholder/200/50',
    timezone: 'UTC',
    maintenanceMode: false,
    notificationChannels: ['Email'],
    emailTemplate: 'Welcome to Fantastiqo!',
    paymentGateways: {
      stripe: { enabled: false, apiKey: '' },
      paypal: { enabled: false, clientId: '' },
    },
    admins: [{ id: 1, email: 'admin@fantastiqo.com', role: 'Admin', permissions: ['Manage Users', 'Manage Courses'] }],
  },
  stats: [
    { id: 1, title: 'Total Learners', value: '1,234', icon: 'fas fa-graduation-cap', trend: 'up' },
    { id: 2, title: 'Active Instructors', value: '56', icon: 'fas fa-chalkboard-teacher', trend: 'up' },
    { id: 3, title: 'Courses', value: '89', icon: 'fas fa-book', trend: 'down' },
    { id: 4, title: 'Revenue', value: '$12,345', icon: 'fas fa-dollar-sign', trend: 'up' },
  ],
  management: [
    {
      id: 1,
      title: 'Manage Learners',
      image: '/api/placeholder/320/180',
      description: 'View and manage learner profiles and progress',
      quickAction: 'Add Learner',
    },
    {
      id: 2,
      title: 'Manage Instructors',
      image: '/api/placeholder/320/180',
      description: 'Oversee instructor activities and approvals',
      quickAction: 'Approve Instructor',
    },
    {
      id: 3,
      title: 'Course Management',
      image: '/api/placeholder/320/180',
      description: 'Create and update course content',
      quickAction: 'Add Course',
    },
  ],
  notifications: [
    { id: 1, message: 'New learner registered!', icon: 'fas fa-user-plus', timestamp: '2025-06-01' },
    { id: 2, message: 'Course approval pending', icon: 'fas fa-book', timestamp: '2025-06-02' },
    { id: 3, message: 'Revenue increased by 5%', icon: 'fas fa-chart-line', timestamp: '2025-06-03' },
  ],
  chartData: {
    enrollmentTrend: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      datasets: [
        {
          label: 'Learner Growth',
          data: [200, 350, 500, 700, 1234],
          backgroundColor: 'rgba(0, 123, 255, 0.2)',
          borderColor: 'rgba(0, 123, 255, 1)',
          borderWidth: 2,
        },
      ],
    },
    revenueBreakdown: {
      labels: ['Courses', 'Subscriptions', 'Other'],
      datasets: [
        {
          label: 'Revenue Sources',
          data: [5000, 3000, 2000],
          backgroundColor: ['#007BFF', '#FFC107', '#28A745'],
        },
      ],
    },
    userDemographics: {
      labels: ['18-24', '25-34', '35-44', '45+'],
      datasets: [
        {
          label: 'Age Groups',
          data: [300, 500, 200, 100],
          backgroundColor: ['#007BFF', '#FFC107', '#28A745', '#DC3545'],
        },
      ],
    },
  },
  learners: [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      status: 'Active',
      coursesEnrolled: 2,
      lastActive: '2025-06-01',
      notes: '',
      progress: { courseId: 1, percentage: 75 },
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'Inactive',
      coursesEnrolled: 1,
      lastActive: '2025-05-15',
      notes: '',
      progress: { courseId: 2, percentage: 50 },
    },
  ],
  instructors: [
    {
      id: 1,
      name: 'Dr. Brown',
      email: 'brown@example.com',
      specialty: 'Programming',
      courses: 3,
      rating: 4.5,
      schedule: 'Mon-Fri 9AM-12PM',
      bio: 'Experienced coder',
    },
    {
      id: 2,
      name: 'Prof. Green',
      email: 'green@example.com',
      specialty: 'Design',
      courses: 2,
      rating: 4.0,
      schedule: 'Tue-Thu 1PM-4PM',
      bio: 'Creative designer',
    },
  ],
  courses: [
    {
      id: 1,
      title: 'Web Development',
      instructorId: 1,
      category: 'Programming',
      price: 99,
      status: 'Published',
      type: 'recorded',
      description: 'Learn web dev',
    },
    {
      id: 2,
      title: 'Graphic Design',
      instructorId: 2,
      category: 'Design',
      price: 79,
      status: 'Draft',
      type: 'recorded',
      description: 'Master design',
    },
    {
      id: 3,
      title: 'Python 1:1',
      instructorId: 1,
      learnerId: 1,
      category: 'Programming',
      nextSession: '2025-06-10',
      type: 'one-on-one',
      description: 'Personalized Python',
    },
    {
      id: 4,
      title: 'Data Science Group',
      instructorId: 1,
      category: 'Programming',
      schedule: '2025-06-15 10AM',
      capacity: 20,
      enrolled: 15,
      type: 'group',
      description: 'Group data science course',
      chat: [{ userId: 1, text: 'When is the next session?', timestamp: '2025-06-01' }],
      videoCalls: [{ id: 1, date: '2025-06-15', time: '10AM', link: 'zoom.link' }],
    },
  ],
  orders: [
    { id: 1, customerId: 1, amount: 99, status: 'Completed', date: '2025-06-01' },
    { id: 2, customerId: 2, amount: 79, status: 'Pending', date: '2025-06-02' },
  ],
  enrolments: [
    { id: 1, learnerId: 1, courseId: 1, status: 'Active', date: '2025-06-01' },
    { id: 2, learnerId: 2, courseId: 2, status: 'Pending', date: '2025-06-02' },
  ],
  chats: [
    {
      id: 1,
      userId: 1,
      userType: 'Learner',
      status: 'Open',
      messages: [{ text: 'Need help with Python', timestamp: '2025-06-01' }],
    },
    {
      id: 2,
      userId: 2,
      userType: 'Instructor',
      status: 'Closed',
      messages: [{ text: 'Course updated', timestamp: '2025-05-30' }],
    },
  ],
  storeItems: [
    { id: 1, title: 'Web Development Course', type: 'Course', price: 99, availability: 'Available' },
    { id: 2, title: 'Monthly Subscription', type: 'Subscription', price: 29, availability: 'Available' },
  ],
  financials: [
    { id: 1, type: 'Sale', amount: 99, status: 'Completed', date: '2025-06-01' },
    { id: 2, type: 'Payout', amount: 50, status: 'Pending', date: '2025-06-02' },
  ],
  payouts: [
    { id: 1, instructorId: 1, amount: 50, date: '2025-06-10' },
  ],
  getStarted: {
    setupGuides: [
      { id: 1, title: 'Configure Platform', description: 'Set up site name, logo, and timezone', completed: false },
      { id: 2, title: 'Add Instructors', description: 'Invite your first instructors', completed: false },
    ],
    quickActions: [
      { id: 1, title: 'Add New Course', action: 'Add Course' },
      { id: 2, title: 'Invite Learner', action: 'Add Learner' },
    ],
  },
};

let idCounter = {
  stats: 5,
  management: 4,
  notifications: 4,
  learners: 3,
  instructors: 3,
  courses: 5,
  orders: 3,
  enrolments: 3,
  chats: 3,
  storeItems: 3,
  financials: 3,
  payouts: 2,
  setupGuides: 3,
  quickActions: 3,
  admins: 2,
};

// Authentication Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};

// Input Validation Middleware
const validateEmail = (email) => validator.isEmail(email);
const validateURL = (url) => validator.isURL(url, { require_protocol: true });
const validateNonEmpty = (str) => str && str.trim().length > 0;

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!validateNonEmpty(username) || !validateNonEmpty(password)) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  // Replace with database check in production
  if (username === 'admin' && password === 'password') {
    const token = jwt.sign({ user: 'admin', email: data.admin.email }, secret, { expiresIn: '1h' });
    return res.json({ token, user: data.admin });
  }
  return res.status(401).json({ error: 'Invalid username or password.' });
});

// Admin Profile
app.get('/api/admin', authenticate, (req, res) => {
  res.json(data.admin);
});

app.put('/api/admin', authenticate, (req, res) => {
  const { name, email } = req.body;
  if (name && validateNonEmpty(name)) data.admin.name = name;
  if (email && validateEmail(email)) data.admin.email = email;
  res.json(data.admin);
});

// Settings
app.get('/api/settings', authenticate, (req, res) => {
  res.json(data.settings);
});

app.put('/api/settings/general', authenticate, (req, res) => {
  const { siteName, siteLogo, timezone, maintenanceMode } = req.body;
  if (siteName && validateNonEmpty(siteName)) data.settings.siteName = siteName;
  if (siteLogo && validateURL(siteLogo)) data.settings.siteLogo = siteLogo;
  if (timezone && validateNonEmpty(timezone)) data.settings.timezone = timezone;
  if (typeof maintenanceMode === 'boolean') data.settings.maintenanceMode = maintenanceMode;
  data.notifications.push({
    id: idCounter.notifications++,
    message: 'General settings updated.',
    icon: 'fas fa-cog',
    timestamp: new Date().toISOString().split('T')[0],
  });
  res.json(data.settings);
});

app.post('/api/settings/admins', authenticate, (req, res) => {
  const { email, role, permissions } = req.body;
  if (!validateEmail(email)) return res.status(400).json({ error: 'Invalid email format.' });
  if (!validateNonEmpty(role)) return res.status(400).json({ error: 'Role is required.' });
  const newAdmin = { id: idCounter.admins++, email, role, permissions: permissions || [] };
  data.settings.admins.push(newAdmin);
  data.notifications.push({
    id: idCounter.notifications++,
    message: `New admin ${email} invited.`,
    icon: 'fas fa-user-plus',
    timestamp: new Date().toISOString().split('T')[0],
  });
  res.status(201).json(newAdmin);
});

app.put('/api/settings/notifications', authenticate, (req, res) => {
  const { channels, emailTemplate } = req.body;
  if (channels && Array.isArray(channels)) data.settings.notificationChannels = channels;
  if (emailTemplate && validateNonEmpty(emailTemplate)) data.settings.emailTemplate = emailTemplate;
  data.notifications.push({
    id: idCounter.notifications++,
    message: 'Notification preferences updated.',
    icon: 'fas fa-bell',
    timestamp: new Date().toISOString().split('T')[0],
  });
  res.json(data.settings);
});

app.put('/api/settings/payment-gateways', authenticate, (req, res) => {
  const { stripe, paypal } = req.body;
  if (stripe) {
    if (typeof stripe.enabled === 'boolean') data.settings.paymentGateways.stripe.enabled = stripe.enabled;
    if (stripe.apiKey && validateNonEmpty(stripe.apiKey)) data.settings.paymentGateways.stripe.apiKey = stripe.apiKey;
  }
  if (paypal) {
    if (typeof paypal.enabled === 'boolean') data.settings.paymentGateways.paypal.enabled = paypal.enabled;
    if (paypal.clientId && validateNonEmpty(paypal.clientId)) data.settings.paymentGateways.paypal.clientId = paypal.clientId;
  }
  data.notifications.push({
    id: idCounter.notifications++,
    message: 'Payment gateways updated.',
    icon: 'fas fa-credit-card',
    timestamp: new Date().toISOString().split('T')[0],
  });
  res.json(data.settings);
});

// Stats
app.get('/api/stats', authenticate, (req, res) => {
  res.json(data.stats);
});

// Management Items
app.get('/api/management', authenticate, (req, res) => {
  res.json(data.management);
});

// Notifications
app.get('/api/notifications', authenticate, (req, res) => {
  res.json(data.notifications);
});

app.delete('/api/notifications/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const index = data.notifications.findIndex(n => n.id === id);
  if (index === -1) return res.status(404).json({ error: 'Notification not found.' });
  data.notifications.splice(index, 1);
  res.status(204).send();
});

// Chart Data
app.get('/api/chart-data', authenticate, (req, res) => {
  const { type } = req.query;
  if (!type || !data.chartData[type]) {
    return res.status(400).json({ error: 'Invalid or missing chart type.' });
  }
  res.json(data.chartData[type]);
});

// Quick Action
app.post('/api/quick-action', authenticate, (req, res) => {
  const { action } = req.body;
  if (!validateNonEmpty(action)) return res.status(400).json({ error: 'Action is required.' });
  data.notifications.push({
    id: idCounter.notifications++,
    message: `Action performed: ${action}`,
    icon: 'fas fa-check-circle',
    timestamp: new Date().toISOString().split('T')[0],
  });
  res.status(201).json({ message: `Action ${action} processed successfully.` });
});

// Get Started
app.get('/api/get-started', authenticate, (req, res) => {
  res.json(data.getStarted);
});

app.put('/api/get-started/setup-guides/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const { completed } = req.body;
  const guide = data.getStarted.setupGuides.find(g => g.id === id);
  if (!guide) return res.status(404).json({ error: 'Setup guide not found.' });
  if (typeof completed === 'boolean') guide.completed = completed;
  data.notifications.push({
    id: idCounter.notifications++,
    message: `Setup guide "${guide.title}" updated.`,
    icon: 'fas fa-check',
    timestamp: new Date().toISOString().split('T')[0],
  });
  res.json(guide);
});

// Learners
app.get('/api/learners', authenticate, (req, res) => {
  const { status } = req.query;
  let learners = data.learners;
  if (status) learners = learners.filter(l => l.status === status);
  res.json(learners);
});

app.get('/api/learners/:id/progress', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const learner = data.learners.find(l => l.id === id);
  if (!learner) return res.status(404).json({ error: 'Learner not found.' });
  res.json(learner.progress);
});

app.post('/api/learners', authenticate, (req, res) => {
  const { name, email, status, notes } = req.body;
  if (!validateNonEmpty(name) || !validateEmail(email)) {
    return res.status(400).json({ error: 'Name and valid email are required.' });
  }
  const newLearner = {
    id: idCounter.learners++,
    name,
    email,
    status: status || 'Active',
    coursesEnrolled: 0,
    lastActive: new Date().toISOString().split('T')[0],
    notes: notes || '',
    progress: {},
  };
  data.learners.push(newLearner);
  data.stats[0].value = (parseInt(data.stats[0].value.replace(',', '')) + 1).toLocaleString();
  data.notifications.push({
    id: idCounter.notifications++,
    message: `New learner ${name} added.`,
    icon: 'fas fa-user-plus',
    timestamp: new Date().toISOString().split('T')[0],
  });
  res.status(201).json(newLearner);
});

app.put('/api/learners/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, status, notes } = req.body;
  const learner = data.learners.find(l => l.id === id);
  if (!learner) return res.status(404).json({ error: 'Learner not found.' });
  if (name && validateNonEmpty(name)) learner.name = name;
  if (email && validateEmail(email)) learner.email = email;
  if (status) learner.status = status;
  if (notes) learner.notes = notes;
  res.json(learner);
});

app.delete('/api/learners/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const index = data.learners.findIndex(l => l.id === id);
  if (index === -1) return res.status(404).json({ error: 'Learner not found.' });
  data.learners.splice(index, 1);
  data.stats[0].value = (parseInt(data.stats[0].value.replace(',', '')) - 1).toLocaleString();
  res.status(204).send();
});

// Instructors
app.get('/api/instructors', authenticate, (req, res) => {
  const { specialty } = req.query;
  let instructors = data.instructors;
  if (specialty) instructors = instructors.filter(i => i.specialty === specialty);
  res.json(instructors);
});

app.get('/api/instructors/:id/metrics', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const instructor = data.instructors.find(i => i.id === id);
  if (!instructor) return res.status(404).json({ error: 'Instructor not found.' });
  res.json({ courses: instructor.courses, rating: instructor.rating });
});

app.post('/api/instructors', authenticate, (req, res) => {
  const { name, email, specialty, bio, schedule } = req.body;
  if (!validateNonEmpty(name) || !validateEmail(email) || !validateNonEmpty(specialty)) {
    return res.status(400).json({ error: 'Name, valid email, and specialty are required.' });
  }
  const newInstructor = {
    id: idCounter.instructors++,
    name,
    email,
    specialty,
    bio: bio || '',
    schedule: schedule || '',
    courses: 0,
    rating: 0,
  };
  data.instructors.push(newInstructor);
  data.stats[1].value = (parseInt(data.stats[1].value) + 1).toString();
  data.notifications.push({
    id: idCounter.notifications++,
    message: `New instructor ${name} added.`,
    icon: 'fas fa-chalkboard-teacher',
    timestamp: new Date().toISOString().split('T')[0],
  });
  res.status(201).json(newInstructor);
});

app.put('/api/instructors/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, specialty, bio, schedule } = req.body;
  const instructor = data.instructors.find(i => i.id === id);
  if (!instructor) return res.status(404).json({ error: 'Instructor not found.' });
  if (name && validateNonEmpty(name)) instructor.name = name;
  if (email && validateEmail(email)) instructor.email = email;
  if (specialty && validateNonEmpty(specialty)) instructor.specialty = specialty;
  if (bio) instructor.bio = bio;
  if (schedule) instructor.schedule = schedule;
  res.json(instructor);
});

app.delete('/api/instructors/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const index = data.instructors.findIndex(i => i.id === id);
  if (index === -1) return res.status(404).json({ error: 'Instructor not found.' });
  data.instructors.splice(index, 1);
  data.stats[1].value = (parseInt(data.stats[1].value) - 1).toString();
  res.status(204).send();
});

// Courses (Recorded, Group, 1:1)
app.get('/api/courses', authenticate, (req, res) => {
  const { type, category } = req.query;
  let courses = data.courses;
  if (type) courses = courses.filter(c => c.type === type);
  if (category) courses = courses.filter(c => c.category === category);
  res.json(courses);
});

app.get('/api/courses/:id/sessions', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const course = data.courses.find(c => c.id === id);
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  if (course.type === 'one-on-one') {
    return res.json({ nextSession: course.nextSession });
  } else if (course.type === 'group') {
    return res.json(course.videoCalls || []);
  }
  return res.json([]);
});

app.post('/api/courses', authenticate, (req, res) => {
  const { title, instructorId, category, price, status, type, description, learnerId, nextSession, schedule, capacity } = req.body;
  if (!validateNonEmpty(title) || !instructorId || !validateNonEmpty(category) || !validateNonEmpty(type)) {
    return res.status(400).json({ error: 'Title, instructor ID, category, and type are required.' });
  }
  const newCourse = {
    id: idCounter.courses++,
    title,
    instructorId: parseInt(instructorId),
    category,
    price: price ? parseFloat(price) : 0,
    status: status || 'Draft',
    type,
    description: description || '',
    learnerId: learnerId ? parseInt(learnerId) : null,
    nextSession: nextSession || null,
    schedule: schedule || null,
    capacity: capacity ? parseInt(capacity) : null,
    enrolled: 0,
    chat: [],
    videoCalls: [],
  };
  data.courses.push(newCourse);
  data.stats[2].value = (parseInt(data.stats[2].value) + 1).toString();
  const instructor = data.instructors.find(i => i.id === newCourse.instructorId);
  if (instructor) instructor.courses += 1;
  data.notifications.push({
    id: idCounter.notifications++,
    message: `New ${type} course "${title}" added.`,
    icon: 'fas fa-book',
    timestamp: new Date().toISOString().split('T')[0],
  });
  res.status(201).json(newCourse);
});

app.put('/api/courses/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const { title, instructorId, category, price, status, description, learnerId, nextSession, schedule, capacity } = req.body;
  const course = data.courses.find(c => c.id === id);
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  if (title && validateNonEmpty(title)) course.title = title;
  if (instructorId) course.instructorId = parseInt(instructorId);
  if (category && validateNonEmpty(category)) course.category = category;
  if (price) course.price = parseFloat(price);
  if (status) course.status = status;
  if (description) course.description = description;
  if (learnerId) course.learnerId = parseInt(learnerId);
  if (nextSession) course.nextSession = nextSession;
  if (schedule) course.schedule = schedule;
  if (capacity) course.capacity = parseInt(capacity);
  res.json(course);
});

app.delete('/api/courses/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const course = data.courses.find(c => c.id === id);
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  const instructor = data.instructors.find(i => i.id === course.instructorId);
  if (instructor) instructor.courses = Math.max(0, instructor.courses - 1);
  data.courses.splice(data.courses.indexOf(course), 1);
  data.stats[2].value = (parseInt(data.stats[2].value) - 1).toString();
  res.status(204).send();
});

// Group Course Chat
app.get('/api/courses/:id/chat', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const course = data.courses.find(c => c.id === id);
  if (!course || course.type !== 'group') return res.status(404).json({ error: 'Group course not found.' });
  res.json(course.chat);
});

app.post('/api/courses/:id/chat', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const { userId, text } = req.body;
  const course = data.courses.find(c => c.id === id);
  if (!course || course.type !== 'group') return res.status(404).json({ error: 'Group course not found.' });
  if (!userId || !validateNonEmpty(text)) return res.status(400).json({ error: 'User ID and message text are required.' });
  course.chat.push({
    userId: parseInt(userId),
    text,
    timestamp: new Date().toISOString().split('T')[0],
  });
  data.notifications.push({
    id: idCounter.notifications++,
    message: `New message in "${course.title}" group chat.`,
    icon: 'fas fa-comments',
    timestamp: new Date().toISOString().split('T')[0],
  });
  res.status(201).json(course.chat);
});

// Group Course Video Calls
app.post('/api/courses/:id/video-calls', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const { date, time, link } = req.body;
  const course = data.courses.find(c => c.id === id);
  if (!course || course.type !== 'group') return res.status(404).json({ error: 'Group course not found.' });
  if (!validateNonEmpty(date) || !validateNonEmpty(time) || !validateURL(link)) {
    return res.status(400).json({ error: 'Date, time, and valid link are required.' });
  }
  const newCall = {
    id: (course.videoCalls.length + 1),
    date,
    time,
    link,
  };
  course.videoCalls.push(newCall);
  data.notifications.push({
    id: idCounter.notifications++,
    message: `New video call scheduled for "${course.title}".`,
    icon: 'fas fa-video',
    timestamp: new Date().toISOString().split('T')[0],
  });
  res.status(201).json(newCall);
});

// Orders
app.get('/api/orders', authenticate, (req, res) => {
  const { status } = req.query;
  let orders = data.orders.map(order => ({
    ...order,
    customer: data.learners.find(l => l.id === order.customerId)?.name || 'Unknown',
  }));
  if (status) orders = orders.filter(o => o.status === status);
  res.json(orders);
});

app.post('/api/orders', authenticate, (req, res) => {
  const { customerId, amount, status } = req.body;
  if (!customerId || !amount || isNaN(parseFloat(amount))) {
    return res.status(400).json({ error: 'Customer ID and valid amount are required.' });
  }
  const customer = data.learners.find(l => l.id === parseInt(customerId));
  if (!customer) return res.status(404).json({ error: 'Customer not found.' });
  const newOrder = {
    id: idCounter.orders++,
    customerId: parseInt(customerId),
    amount: parseFloat(amount),
    status: status || 'Pending',
    date: new Date().toISOString().split('T')[0],
  };
  data.orders.push(newOrder);
  data.financials.push({
    id: idCounter.financials++,
    type: 'Sale',
    amount: newOrder.amount,
    status: newOrder.status,
    date: newOrder.date,
  });
  data.stats[3].value = `$${parseInt(data.stats[3].value.replace(/[$,]/g, '')) + newOrder.amount}`;
  data.notifications.push({
    id: idCounter.notifications++,
    message: `New order #${newOrder.id} punched for ${customer.name}.`,
    icon: 'fas fa-box-open',
    timestamp: new Date().toISOString().split('T')[0],
  });
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const order = data.orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (status) order.status = status;
  const financial = data.financials.find(f => f.type === 'Sale' && f.amount === order.amount && f.date === order.date);
  if (financial) financial.status = status;
  res.json(order);
});

app.delete('/api/orders/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const index = data.orders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found.' });
  const order = data.orders[index];
  data.orders.splice(index, 1);
  data.stats[3].value = `$${parseInt(data.stats[3].value.replace(/[$,]/g, '')) - order.amount}`;
  res.status(204).send();
});

// Enrolments
app.get('/api/enrolments', authenticate, (req, res) => {
  const { status } = req.query;
  let enrolments = data.enrolments.map(enrolment => ({
    ...enrolment,
    learner: data.learners.find(l => l.id === enrolment.learnerId)?.name || 'Unknown',
    course: data.courses.find(c => c.id === enrolment.courseId)?.title || 'Unknown',
  }));
  if (status) enrolments = enrolments.filter(e => e.status === status);
  res.json(enrolments);
});

app.post('/api/enrolments', authenticate, (req, res) => {
  const { learnerId, courseId, status } = req.body;
  if (!learnerId || !courseId) return res.status(400).json({ error: 'Learner ID and course ID are required.' });
  const learner = data.learners.find(l => l.id === parseInt(learnerId));
  const course = data.courses.find(c => c.id === parseInt(courseId));
  if (!learner) return res.status(404).json({ error: 'Learner not found.' });
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  if (course.type === 'group' && course.enrolled >= course.capacity) {
    return res.status(400).json({ error: 'Course is at full capacity.' });
  }
  const newEnrolment = {
    id: idCounter.enrolments++,
    learnerId: parseInt(learnerId),
    courseId: parseInt(courseId),
    status: status || 'Pending',
    date: new Date().toISOString().split('T')[0],
  };
  data.enrolments.push(newEnrolment);
  learner.coursesEnrolled += 1;
  if (course.type === 'group') course.enrolled += 1;
  if (course.type === 'one-on-one') course.learnerId = learnerId;
  learner.progress.courseId = courseId;
  learner.progress.percentage = 0;
  data.notifications.push({
    id: idCounter.notifications++,
    message: `Learner ${learner.name} enrolled in "${course.title}".`,
    icon: 'fas fa-user-plus',
    timestamp: new Date().toISOString().split('T')[0],
  });
  res.status(201).json(newEnrolment);
});

app.put('/api/enrolments/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const enrolment = data.enrolments.find(e => e.id === id);
  if (!enrolment) return res.status(404).json({ error: 'Enrolment not found.' });
  if (status) enrolment.status = status;
  res.json(enrolment);
});

app.delete('/api/enrolments/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const enrolment = data.enrolments.find(e => e.id === id);
  if (!enrolment) return res.status(404).json({ error: 'Enrolment not found.' });
  const learner = data.learners.find(l => l.id === enrolment.learnerId);
  const course = data.courses.find(c => c.id === enrolment.courseId);
  if (learner) learner.coursesEnrolled = Math.max(0, learner.coursesEnrolled - 1);
  if (course && course.type === 'group') course.enrolled = Math.max(0, course.enrolled - 1);
  data.enrolments.splice(data.enrolments.indexOf(enrolment), 1);
  res.status(204).send();
});

// Chats
app.get('/api/chats', authenticate, (req, res) => {
  const { userType, status } = req.query;
  let chats = data.chats;
  if (userType) chats = chats.filter(c => c.userType === userType);
  if (status) chats = chats.filter(c => c.status === status);
  res.json(chats);
});

app.post('/api/chats', authenticate, (req, res) => {
  const { userId, userType, message } = req.body;
  if (!userId || !validateNonEmpty(userType) || !validateNonEmpty(message)) {
    return res.status(400).json({ error: 'User ID, user type, and message are required.' });
  }
  const user = userType === 'Learner' ? data.learners.find(l => l.id === parseInt(userId)) : data.instructors.find(i => i.id === parseInt(userId));
  if (!user) return res.status(404).json({ error: `${userType} not found.` });
  const newChat = {
    id: idCounter.chats++,
    userId: parseInt(userId),
    userType,
    status: 'Open',
    messages: [{ text: message, timestamp: new Date().toISOString().split('T')[0] }],
  };
  data.chats.push(newChat);
  data.notifications.push({
    id: idCounter.notifications++,
    message: `New chat started with ${userType} ${user.name}.`,
    icon: 'fas fa-comments',
    timestamp: new Date().toISOString().split('T')[0],
  });
  res.status(201).json(newChat);
});

app.post('/api/chats/:id/message', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const { text } = req.body;
  const chat = data.chats.find(c => c.id === id);
  if (!chat) return res.status(404).json({ error: 'Chat not found.' });
  if (!validateNonEmpty(text)) return res.status(400).json({ error: 'Message text is required.' });
  chat.messages.push({
    text,
    timestamp: new Date().toISOString().split('T')[0],
    sender: 'Admin',
  });
  chat.status = 'Open';
  res.json(chat);
});

app.put('/api/chats/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const chat = data.chats.find(c => c.id === id);
  if (!chat) return res.status(404).json({ error: 'Chat not found.' });
  if (status) chat.status = status;
  res.json(chat);
});

// Store Items
app.get('/api/store', authenticate, (req, res) => {
  const { type, availability } = req.query;
  let items = data.storeItems;
  if (type) items = items.filter(i => i.type === type);
  if (availability) items = items.filter(i => i.availability === availability);
  res.json(items);
});

app.post('/api/store/cart', authenticate, (req, res) => {
  const { itemId, quantity } = req.body;
  if (!itemId || !quantity || isNaN(parseInt(quantity))) {
    return res.status(400).json({ error: 'Item ID and valid quantity are required.' });
  }
  const item = data.storeItems.find(i => i.id === parseInt(itemId));
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  if (item.availability !== 'Available') return res.status(400).json({ error: 'Item is not available.' });
  data.notifications.push({
    id: idCounter.notifications++,
    message: `Added ${quantity} x "${item.title}" to cart.`,
    icon: 'fas fa-shopping-cart',
    timestamp: new Date().toISOString().split('T')[0],
  });
  res.status(201).json({ message: 'Item added to cart.', item, quantity });
});

app.post('/api/store/checkout', authenticate, (req, res) => {
  const { items } = req.body; // Array of { itemId, quantity }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart items are required.' });
  }
  let total = 0;
  for (const cartItem of items) {
    const item = data.storeItems.find(i => i.id === parseInt(cartItem.itemId));
    if (!item) return res.status(404).json({ error: `Item ID ${cartItem.itemId} not found.` });
    total += item.price * parseInt(cartItem.quantity);
  }
  const order = {
    id: idCounter.orders++,
    customerId: data.learners[0].id, // Placeholder; replace with actual user ID
    amount: total,
    status: 'Completed',
    date: new Date().toISOString().split('T')[0],
  };
  data.orders.push(order);
  data.financials.push({
    id: idCounter.financials++,
    type: 'Sale',
    amount: total,
    status: 'Completed',
    date: order.date,
  });
  data.stats[3].value = `$${parseInt(data.stats[3].value.replace(/[$,]/g, '')) + total}`;
  data.notifications.push({
    id: idCounter.notifications++,
    message: `Checkout completed for order #${order.id}.`,
    icon: 'fas fa-check-circle',
    timestamp: new Date().toISOString().split('T')[0],
  });
  res.status(201).json(order);
});

// Financials
app.get('/api/financials', authenticate, (req, res) => {
  const { type, status } = req.query;
  let financials = data.financials;
  if (type) financials = financials.filter(f => f.type === type);
  if (status) financials = financials.filter(f => f.status === status);
  res.json(financials);
});

app.get('/api/financials/summary', authenticate, (req, res) => {
  const revenue = data.financials
    .filter(f => f.type === 'Sale' && f.status === 'Completed')
    .reduce((sum, f) => sum + f.amount, 0);
  const expenses = data.financials
    .filter(f => f.type === 'Payout' && f.status === 'Completed')
    .reduce((sum, f) => sum + f.amount, 0);
  const pendingPayouts = data.financials
    .filter(f => f.type === 'Payout' && f.status === 'Pending')
    .reduce((sum, f) => sum + f.amount, 0);
  res.json({ totalRevenue: revenue, totalExpenses: expenses, pendingPayouts });
});

app.post('/api/payouts', authenticate, (req, res) => {
  const { instructorId, amount, date } = req.body;
  if (!instructorId || !amount || isNaN(parseFloat(amount)) || !validateNonEmpty(date)) {
    return res.status(400).json({ error: 'Instructor ID, valid amount, and date are required.' });
  }
  const instructor = data.instructors.find(i => i.id === parseInt(instructorId));
  if (!instructor) return res.status(404).json({ error: 'Instructor not found.' });
  const newPayout = {
    id: idCounter.payouts++,
    instructorId: parseInt(instructorId),
    amount: parseFloat(amount),
    date,
  };
  data.payouts.push(newPayout);
  data.financials.push({
    id: idCounter.financials++,
    type: 'Payout',
    amount: newPayout.amount,
    status: 'Pending',
    date,
  });
  data.notifications.push({
    id: idCounter.notifications++,
    message: `Payout of $${amount} scheduled for ${instructor.name} on ${date}.`,
    icon: 'fas fa-dollar-sign',
    timestamp: new Date().toISOString().split('T')[0],
  });
  res.status(201).json(newPayout);
});

// Analytics
app.get('/api/analytics/summary', authenticate, (req, res) => {
  const totalEnrollments = data.enrolments.length;
  const totalRevenue = data.financials
    .filter(f => f.type === 'Sale' && f.status === 'Completed')
    .reduce((sum, f) => sum + f.amount, 0);
  const activeUsers = data.learners.filter(l => l.status === 'Active').length;
  res.json({ totalEnrollments, totalRevenue, activeUsers });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(`${new Date().toISOString()} - Error: ${err.stack}`);
  res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});