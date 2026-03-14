const mongoose = require('mongoose');

// Cache the connection in a global variable to persist across serverless functions
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  const mongoURL = process.env.MONGODB_URL;
  
  if (!mongoURL) {
    console.error('[db.js] CRITICAL: MONGODB_URL environment variable is not defined!');
    throw new Error('MONGODB_URL is missing');
  }

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
      const dbName = mongoose.connection.name;
      console.log(`MongoDB connected successfully to database: ${dbName}`);
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
