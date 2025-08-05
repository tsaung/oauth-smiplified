import { Request, Response } from 'express';
import { promisify } from 'util';
import crypto from 'crypto';
import { URLSearchParams } from 'url';
import * as GithubService from '../services/github.service';

// --- Constants ---
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const REDIRECT_URI = process.env.BASE_URL! + '/callback';
const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';

// --- Route Handlers ---

export const handleLogin = (req: Request, res: Response) => {
  delete req.session.accessToken;
  const state = crypto.randomBytes(16).toString('hex');
  req.session.state = state;

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'user public_repo',
    state: state,
  });

  res.redirect(`${GITHUB_AUTHORIZE_URL}?${params.toString()}`);
};

export const handleCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!state || state !== req.session.state) {
    return res.redirect('/?error=invalid_state');
  }

  delete req.session.state;

  try {
    const accessToken = await GithubService.getAccessToken({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code: code as string,
      redirect_uri: REDIRECT_URI,
    });

    req.session.accessToken = accessToken;

    const saveSession = promisify(req.session.save).bind(req.session);
    await saveSession();

    res.redirect('/');
  } catch (error) {
    console.error('Callback handler error:', error);
    res.redirect('/?error=auth_failed');
  }
};

export const handleLogout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Failed to destroy session:', err);
    }
    res.redirect('/');
  });
};
