import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Resolve server/.env from this file's location so it loads no matter which
// folder the process was started from (root `npm run dev` or inside /server).
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

// Fail fast: without these the app cannot work safely, so stop with a clear message
// instead of crashing later with a confusing stack trace.
const required = ['MONGO_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`\n[config] Missing required environment variable(s): ${missing.join(', ')}`);
  console.error('[config] Copy server/.env.example to server/.env and fill in the values.\n');
  process.exit(1);
}

const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
};
env.isProd = env.nodeEnv === 'production';

export default env;
