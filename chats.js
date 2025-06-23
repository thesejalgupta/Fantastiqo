const express = require('express');
const router = express.Router();
const Chat = require('../models/chat');
const authMiddleware = require('../middleware/auth');

// Get all chats (Admin or Instructor)
router.get('/', authMiddleware(['admin', 'instructor']), async (req, res) => {
  try {
    const chats = await Chat.find().populate('course messages.user');
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new chat (Admin or Instructor)
router.post('/', authMiddleware(['admin', 'instructor']), async (req, res) => {
  try {
    const chat = new Chat(req.body);
    await chat.save();
    res.status(201).json(chat);
  } catch (err) {
    res.status(400).json({ message: 'Error creating chat' });
  }
});

// Add message to chat
router.post('/:id/messages', authMiddleware(['admin', 'instructor', 'learner']), async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    chat.messages.push(req.body);
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(400).json({ message: 'Error adding message' });
  }
});

// Update chat status
router.put('/:id', authMiddleware(['admin', 'instructor']), async (req, res) => {
  try {
    const chat = await Chat.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    res.json(chat);
  } catch (err) {
    res.status(400).json({ message: 'Error updating chat' });
  }
});

// Delete chat
router.delete('/:id', authMiddleware(['admin', 'instructor']), async (req, res) => {
  try {
    const chat = await Chat.findByIdAndDelete(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    res.json({ message: 'Chat deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;