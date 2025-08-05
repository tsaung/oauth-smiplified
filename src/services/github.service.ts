import { error } from 'console';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { GitHubUser, GitHubRepo } from '../types/github';

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

interface TokenRequestData {
  client_id: string;
  client_secret: string;
  code: string;
  redirect_uri: string;
}

interface ResponseTokenData {
  access_token?: string;
  error?: string;
}

/**
 * Exchanges an authorization code for an access token.
 * @param data - The data required for the token exchange.
 * @returns The access token from GitHub.
 */
export async function getAccessToken(data: TokenRequestData): Promise<string> {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      ...data,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${await response.text()}`);
  }

  // Type predicate function for later use
  // Type guard to ensure the response is a ResponseTokenData, otherwise throw an error
  //   function isResponseTokenData(data: any): data is ResponseTokenData {
  //     return 'access_token' in data || 'error' in data;
  //   }

  const result: ResponseTokenData =
    (await response.json()) as ResponseTokenData;

  if (result.error || !result.access_token) {
    throw new Error(
      `GitHub API error on token exchange: ${
        result.error || 'No token returned'
      }`
    );
  }

  return result.access_token;
}

/**
 * Fetches the authenticated user's profile from GitHub.
 * @param accessToken - The user's OAuth access token.
 * @returns The user's profile data.
 */
export async function getUserProfile(accessToken: string): Promise<GitHubUser> {
  const response = await fetch(`${GITHUB_API_URL}/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${await response.text()}`);
  }

  return response.json() as Promise<GitHubUser>;
}

/**
 * Fetches the authenticated user's repositories from GitHub.
 * @param accessToken - The user's OAuth access token.
 * @returns A list of the user's repositories.
 */
export async function getUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const response = await fetch(`${GITHUB_API_URL}/user/repos`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user repos: ${await response.text()}`);
  }

  return response.json() as Promise<GitHubRepo[]>;
}
