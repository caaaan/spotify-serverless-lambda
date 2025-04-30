export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface SpotifyError {
  error: string;
  error_description: string;
}

export interface SpotifyAuthQuery {
  code?: string;
  state?: string;
  error?: string;
} 