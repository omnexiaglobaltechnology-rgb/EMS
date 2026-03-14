// Load environment variables FIRST!
require('dotenv').config();

const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start server only when run directly (local dev / container).
if (require.main === module) {
  // Connect to database FIRST, then load app
  connectDB()
    .then(() => {
      // Load app AFTER database connection is established
      const app = require('./app');
      const http = require('http');
      const { initSocket } = require('./utils/socket.service');

      const server = http.createServer(app);
      initSocket(server);

      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Failed to connect to database:', error);
      process.exit(1);
    });
} else {
  // For testing/serverless, export app directly
  module.exports = require('./app');
}
