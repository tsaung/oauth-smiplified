import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import sessionFileStore from 'session-file-store';

import apiRoutes from './routes'; // Import the main router

// Config
dotenv.config();
const FileStore = sessionFileStore(session);
const app = express();
const PORT = process.env.PORT || 3000;

// Augment session type for TypeScript
declare module 'express-session' {
  interface SessionData {
    accessToken?: string;
    state?: string;
  }
}

// Middleware
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(
  session({
    store: new FileStore({ path: './sessions', ttl: 86400, retries: 0 }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' },
  }),
);

// Main application routes
app.use('/', apiRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
