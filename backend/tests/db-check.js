require('dotenv').config({ path: 'c:/Users/asus/Desktop/ems-dev/backend/.env' });
const mongoose = require('mongoose');

const mongoURL = process.env.MONGODB_URL;
console.log('Testing connection to:', mongoURL.split('@')[1] || mongoURL); // Hide password

async function runTest() {
  try {
    await mongoose.connect(mongoURL, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('CONNECTED');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    // Try a simple find on TimeLog if it exists
    const TimeLog = mongoose.model('TimeLog', new mongoose.Schema({}, { strict: false }), 'timelogs');
    console.log('Querying timelogs...');
    const result = await TimeLog.findOne().limit(1);
    console.log('Query result:', result);

    await mongoose.disconnect();
    console.log('DISCONNECTED');
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exit(1);
  }
}

runTest();
