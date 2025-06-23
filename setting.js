const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Null for platform-wide settings
  siteName: { type: String },
  siteLogoUrl: { type: String },
  timezone: { type: String },
  maintenanceMode: { type: Boolean, default: false },
  paymentGateways: [{
    name: { type: String, enum: ['stripe', 'paypal'] },
    apiKey: { type: String },
    clientId: { type: String }
  }],
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    frequency: { type: String, enum: ['immediate', 'daily', 'weekly'], default: 'immediate' }
  },
  theme: {
    mode: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    accentColor: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);