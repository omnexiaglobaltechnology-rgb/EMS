const mongoose = require('mongoose');

// Cache the connection in a global variable to persist across serverless functions
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  const mongoURL =
    process.env.MONGODB_URL ||
    'mongodb://rajputboyofficial50188_db_user:tOo39iaGRPGRokMa@ac-ujdvt23-shard-00-00.z1zwewn.mongodb.net:27017,ac-ujdvt23-shard-00-01.z1zwewn.mongodb.net:27017,ac-ujdvt23-shard-00-02.z1zwewn.mongodb.net:27017/ems?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

  const maskedURL = mongoURL.replace(/:\/\/.*@/, "://****:****@");
  console.log(`[db.js] Attempting connection with: ${maskedURL}`);

  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('Attempting new connection to MongoDB...');
    const opts = {
      bufferCommands: false, // Disable buffering for faster failures in serverless
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(mongoURL, opts).then((mongoose) => {
      console.log('MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('MongoDB connection error:', e.message);
    throw e;
  }

  return cached.conn;
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

module.exports = { connectDB, disconnectDB, mongoose };
