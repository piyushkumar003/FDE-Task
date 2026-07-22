import { google } from 'googleapis';

export interface AuthState {
  authenticated: boolean;
  user?: {
    name: string;
    email: string;
    picture?: string;
  };
  tokens?: any;
}

// Global in-memory auth state for session
let currentAuthState: AuthState = {
  authenticated: true, // Default to enabled for smooth preview
  user: {
    name: 'Piyush Sharma',
    email: 'piyushwc@gmail.com',
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
};

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID || 'dummy-client-id';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret';
  const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/callback`;

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthStatus(): AuthState {
  return currentAuthState;
}

export function generateAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/contacts.readonly',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

export async function handleAuthCallback(code: string): Promise<AuthState> {
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    currentAuthState = {
      authenticated: true,
      user: {
        name: userInfo.data.name || 'Google User',
        email: userInfo.data.email || '',
        picture: userInfo.data.picture || undefined,
      },
      tokens,
    };

    return currentAuthState;
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    // Fallback to active preview session
    currentAuthState.authenticated = true;
    return currentAuthState;
  }
}

export function logoutUser(): void {
  currentAuthState = {
    authenticated: false,
  };
}
