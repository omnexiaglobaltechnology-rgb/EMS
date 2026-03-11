const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURL = 'mongodb+srv://rajputboyofficial50188_db_user:tOo39iaGRPGRokMa@cluster0.z1zwewn.mongodb.net/ems?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('Attempting to connect to MongoDB...');
    
    await mongoose.connect(mongoURL, {
      serverSelectionTimeoutMS: 10000,
      bufferCommands: true,
    });
    
    console.log('MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('MongoDB disconnection failed:', error.message);
    throw error;
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  mongoose
};
