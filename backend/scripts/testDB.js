const mongoose = require('mongoose');

// Testing a "Standard" connection string format that avoids SRV lookup
// Using the shards found via nslookup
const mongoURL = 'mongodb://rajputboyofficial50188_db_user:tOo39iaGRPGRokMa@ac-ujdvt23-shard-00-00.z1zwewn.mongodb.net:27017,ac-ujdvt23-shard-00-01.z1zwewn.mongodb.net:27017,ac-ujdvt23-shard-00-02.z1zwewn.mongodb.net:27017/ems?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

async function test() {
  try {
    console.log('--- DB CONNECTION TEST ---');
    console.log('Testing Standard Connection String (Non-SRV)...');
    
    await mongoose.connect(mongoURL, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('SUCCESS: Connected to MongoDB Atlas!');
    process.exit(0);
  } catch (err) {
    console.error('FAILED: could not connect to MongoDB Atlas.');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    process.exit(1);
  }
}

test();
