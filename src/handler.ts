import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';
import { generateRandomString, getAuthUrl } from './utils/auth';
import { SpotifyAuthQuery, SpotifyTokenResponse } from './types/spotify';

// Store tokens in memory (in production, use a proper storage solution)
let accessToken: string | null = null;

export const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const state = generateRandomString(16);
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing environment variables' })
    };
  }

  const authUrl = getAuthUrl(clientId, redirectUri, state);

  return {
    statusCode: 302,
    headers: {
      Location: authUrl
    },
    body: ''
  };
};

export const callback = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const queryParams = event.queryStringParameters as SpotifyAuthQuery;

  if (queryParams.error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: queryParams.error })
    };
  }

  if (!queryParams.code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No code provided' })
    };
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing environment variables' })
    };
  }

  try {
    const response = await axios.post<SpotifyTokenResponse>(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: queryParams.code,
        redirect_uri: redirectUri
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        }
      }
    );

    accessToken = response.data.access_token;

    return {
      statusCode: 302,
      headers: {
        Location: '/'
      },
      body: ''
    };
  } catch (error) {
    console.error('Error getting access token:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get access token' })
    };
  }
};

export const token = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (!accessToken) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'No access token available' })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ access_token: accessToken })
  };
};

