const mongoose = require('mongoose');

const enrolmentSchema = new mongoose.Schema({
  learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  status: { type: String, enum: ['active', 'pending', 'completed'], required: true },
  enrolledAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Enrolment', enrolmentSchema);