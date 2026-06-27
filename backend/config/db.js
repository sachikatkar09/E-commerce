const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('[connectDB] Attempting to connect to MongoDB...');
    console.log('[connectDB] MongoDB URI:', process.env.MONGO_URI);
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[connectDB] MongoDB Connected: ${conn.connection.host}`);
    console.log(`[connectDB] Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`[connectDB] Connection Error: ${error.message}`);
    console.error('[connectDB] Error stack:', error.stack);
    process.exit(1);
  }
};

module.exports = connectDB;
