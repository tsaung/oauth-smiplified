// Describes the structure of the user object from the GitHub API
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  // Add any other fields you need
}

// Describes the structure of a repository object
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
}