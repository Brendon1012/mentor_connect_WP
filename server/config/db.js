import mongoose from 'mongoose';
import env from './env.js';

const RETRY_MS = 5000;

// Keep retrying instead of exiting, so the API stays up and can answer 503
// ("service unavailable") while the database is down, then recovers by itself.
export async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[db] Connected to MongoDB (${mongoose.connection.name})`);
  } catch (err) {
    console.error(`[db] MongoDB connection failed: ${err.message}`);
    console.error(`[db] Retrying in ${RETRY_MS / 1000}s...`);
    setTimeout(connectDB, RETRY_MS);
  }
}

mongoose.connection.on('disconnected', () => console.warn('[db] MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('[db] MongoDB reconnected'));

export const isDbConnected = () => mongoose.connection.readyState === 1;
