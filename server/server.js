import env from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

const server = app.listen(env.port, () => {
  console.log(`[api] MentorConnect API running on http://localhost:${env.port} (${env.nodeEnv})`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[api] Port ${env.port} is already in use. Stop the other process or change PORT in server/.env.`);
    process.exit(1);
  }
  throw err;
});

connectDB();
