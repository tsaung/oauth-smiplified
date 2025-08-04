// Import the necessary types from node-fetch
import fetch, { RequestInit, Response } from 'node-fetch';

/**
 * A modern replacement for http_build_query.
 * It creates a URL-encoded string from an object.
 * Note: This is now built-in with the URLSearchParams class.
 */
import { URLSearchParams } from 'url';

/**
 * Makes an API request, mirroring the functionality of the original PHP function.
 *
 * @param url The URL to send the request to.
 * @param postData An optional object of data to send as the request body (for POST requests).
 * @param accessToken An optional access token for Authorization.
 * @returns A Promise that resolves to the JSON-decoded response body.
 */
export async function apiRequest(
  url: string,
  postData?: Record<string, any>,
  accessToken?: string
): Promise<any> {

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json, application/json',
    'User-Agent': 'https://example-app.com/',
  };

  // Add the Authorization header if an access token is provided
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const requestOptions: RequestInit = {
    headers: headers,
  };

  // If postData is provided, configure the request as a POST
  if (postData) {
    requestOptions.method = 'POST';
    // The PHP http_build_query is equivalent to creating a URL-encoded string.
    // URLSearchParams is the standard way to do this in JS/Node.
    requestOptions.body = new URLSearchParams(postData).toString();
    // It's crucial to set the Content-Type for POST requests with form data
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  } else {
    requestOptions.method = 'GET';
  }

  try {
    console.log('Trying to send request to ', url, requestOptions.method);
    const response: Response = await fetch(url, requestOptions);

    // Check if the request was successful
    if (!response.ok) {
      // Throw an error with the status to handle it in the calling code
      throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
    }
    
    // The PHP `json_decode($response, true)` is equivalent to response.json()
    // It automatically parses the JSON response body and returns a JavaScript object.
    return await response.json();
    
  } catch (error) {
    console.error('There was an error with the API request:', error);
    // Re-throw or handle the error as appropriate for your application
    throw error;
  }
}

// --- Example Usage ---

// A mock access token, which would typically come from your app's authentication flow.
const MOCK_ACCESS_TOKEN = 'your_github_access_token_here';

// Example 1: Making a GET request (e.g., get user info)
async function getUserProfile() {
  try {
    const user = await apiRequest('https://api.github.com/user', undefined, MOCK_ACCESS_TOKEN);
    console.log('User Profile:', user);
  } catch (error) {
    console.error('Failed to get user profile.');
  }
}

// Example 2: Making a POST request (This is a fictional endpoint for demonstration)
async function createPost() {
  const newPostData = {
    title: 'Hello World',
    body: 'This is my first post!',
    userId: 1
  };

  try {
    // Using a public test API for the POST example
    const createdPost = await apiRequest('https://jsonplaceholder.typicode.com/posts', newPostData);
    console.log('Created Post:', createdPost);
  } catch (error) {
    console.error('Failed to create post.');
  }
}

// Run the examples
// getUserProfile();
// createPost();