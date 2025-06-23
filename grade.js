const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  grade: { type: String, required: true },
  feedback: { type: String },
  gradedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Grade', gradeSchema);