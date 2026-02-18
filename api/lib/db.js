// MongoDB connection singleton for serverless
const mongoose = require('mongoose');

let conn = null;

async function connectDB() {
  if (conn && conn.readyState === 1) return conn;
  if (conn) return conn;

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('MONGODB_URI env var not set');

  conn = await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  console.log('Connected to MongoDB');
  return conn;
}

module.exports = { connectDB };
