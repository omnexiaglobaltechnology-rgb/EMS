const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Destructive: Reset all collections
router.post('/reset-db', async (req, res) => {
  try {
    const { key } = req.body;
    // Simple protection for development/this specific request
    if (key !== 'RESET_EMS_2026') {
      return res.status(403).json({ error: 'Unauthorized reset request' });
    }

    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Database has been cleared. All collections are now empty.' 
    });
  } catch (error) {
    console.error('[reset-db] Error:', error.message);
    return res.status(500).json({ error: 'Failed to reset database' });
  }
});

module.exports = router;
