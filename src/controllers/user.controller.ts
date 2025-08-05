import { Request, Response } from 'express';
import * as GithubService from '../services/github.service';

export const showDashboard = async (req: Request, res: Response) => {
  if (!req.session.accessToken) {
    return res.render('index', { user: null });
  }
  try {
    const user = await GithubService.getUserProfile(req.session.accessToken);
    res.render('index', { user: user });
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    res.redirect('/logout');
  }
};

export const showRepos = async (req: Request, res: Response) => {
    if (!req.session.accessToken) {
        return res.redirect('/login');
    }
    try {
        const repos = await GithubService.getUserRepos(req.session.accessToken);
        res.render('repos', { repos: repos });
    } catch (error) {
        console.error("Failed to fetch user repos:", error);
        res.redirect('/');
    }
};