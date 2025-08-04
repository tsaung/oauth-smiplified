import dotenv from 'dotenv';
import type { Request, Response } from 'express';
import express from 'express';
import path from 'path';
import session from 'express-session';
import crypto from 'crypto';
import { apiRequest } from './auth';
import sessionFileStore from 'session-file-store';

const FileStore = sessionFileStore(session);
declare module 'express-session' {
  interface SessionData {
    accessToken: string;
    state: string;
    user: object | null;
  }
}

dotenv.config();
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API_URL = 'https://api.github.com';
const REDIRECT_URI = process.env.BASE_URL;

const app = express();
const port = process.env.port || 3000;

app.use(express.static('public'));
app.use(
  session({
    store: new FileStore({
      path: path.join('./../sessions'),
      ttl: 24 * 60 * 60,
      retries: 5,
    }),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
    },
  })
);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', async (req: Request, res: Response) => {
  if (req.session.accessToken && !req.session.user) {
    const userResponse = await apiRequest(
      `${GITHUB_API_URL}/user`,
      undefined,
      req.session.accessToken
    );
    req.session.user = userResponse;
  }

  return res.render('index', { user: req.session.user });
});

app.get('/login', (req: Request, res: Response) => {
  delete req.session.accessToken;
  const state = crypto.randomBytes(16).toString('hex');

  req.session.state = state; // this line save to persistent session file

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: GITHUB_CLIENT_ID!,
    redirect_uri: REDIRECT_URI!,
    scope: 'user public_repo',
    state: state,
  });

  const authorizeUrl = `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
  res.redirect(authorizeUrl);
});

app.get('/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!state || state !== req.session.state) {
    return res.status(400).send('Invalid state parameter');
  }
  delete req.session.state;

  const postData = {
    grantType: 'authorization_code',
    client_id: GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET!,
    code: code as string,
    redirect_uri: REDIRECT_URI!,
  };
  try {
    const tokenResponse = await apiRequest(GITHUB_TOKEN_URL, postData);

    if (!tokenResponse.access_token) {
      return res.status(400).send('No access token from GitHub');
    }
    req.session.accessToken = tokenResponse.access_token; // but this line didn't save to session file
    req.session.save((err) => {
      if (err) throw err;
      console.log('Session saved');
      res.redirect('/');
    });
  } catch (error) {
    console.error('GitHub access token creation error:', error);
    return res.send(`GitHub access token creation error: ${error}`);
  }
});

app.get('/logout', (req: Request, res: Response) => {
  delete req.session.accessToken;
  delete req.session.user;
  res.redirect('/');
});

app.get('/repos', async (req: Request, res: Response) => {
  if (req.session.accessToken) {
    const searchParams = new URLSearchParams({
      sort: 'created',
      direction: 'desc',
    });
    const reposUrl = `${GITHUB_API_URL}/user/repos?${searchParams.toString()}`;
    const reposResponse = await apiRequest(
      reposUrl, // `${GITHUB_API_URL`,
      undefined,
      req.session.accessToken
    );
    return res.render('repos', {
      user: req.session.user,
      repos: reposResponse,
    });
  }

  return res.redirect('/');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
