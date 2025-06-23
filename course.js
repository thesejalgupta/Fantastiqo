const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  courseType: { type: String, enum: ['recorded', 'group', 'one_on_one'], required: true },
  description: { type: String },
  schedule: { type: Date },
  capacity: { type: Number },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);