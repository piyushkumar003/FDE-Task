import { google } from 'googleapis';
import { getSession, setSessionAuthenticated, setSessionGuestMode, logoutSession } from './memory';

export interface AuthState {
  authenticated: boolean;
  isGuest: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
}

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID || 'dummy-client-id';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret';
  const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/callback`;

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthStatus(sessionId: string = 'default'): AuthState {
  const session = getSession(sessionId);
  return {
    authenticated: session.isAuthenticated,
    isGuest: session.isGuest,
    user: session.user,
  };
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

export async function handleAuthCallback(code: string, sessionId: string = 'default'): Promise<AuthState> {
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const user = {
      id: userInfo.data.id || `google-${Date.now()}`,
      name: userInfo.data.name || 'Google User',
      email: userInfo.data.email || '',
      picture: userInfo.data.picture || undefined,
    };

    setSessionAuthenticated(sessionId, user, tokens);

    return {
      authenticated: true,
      isGuest: false,
      user,
    };
  } catch (error: any) {
    console.error('Error handling Google OAuth callback:', error);
    throw new Error(error?.message || 'Failed to authenticate with Google');
  }
}

export function handleGuestLogin(sessionId: string = 'default'): AuthState {
  const session = setSessionGuestMode(sessionId, true);
  return {
    authenticated: false,
    isGuest: true,
    user: session.user,
  };
}

export function logoutUser(sessionId: string = 'default'): AuthState {
  logoutSession(sessionId);
  return {
    authenticated: false,
    isGuest: false,
  };
}

