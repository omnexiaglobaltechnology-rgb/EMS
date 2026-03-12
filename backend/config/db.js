const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURL = 'mongodb://rajputboyofficial50188_db_user:tOo39iaGRPGRokMa@ac-ujdvt23-shard-00-00.z1zwewn.mongodb.net:27017,ac-ujdvt23-shard-00-01.z1zwewn.mongodb.net:27017,ac-ujdvt23-shard-00-02.z1zwewn.mongodb.net:27017/ems?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';
    
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
