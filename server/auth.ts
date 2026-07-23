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
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing required Google OAuth environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URI.');
  }

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
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const maskedClientId = clientId.length > 8 ? `${clientId.substring(0, 4)}...${clientId.substring(clientId.length - 4)}` : '****';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  const scopes = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/contacts.readonly',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
  ];

  console.log('[Google OAuth Debug] Generating Auth URL:', {
    appUrl: process.env.APP_URL || 'not set',
    googleRedirectUri: redirectUri || 'MISSING',
    generatedRedirectUri: redirectUri,
    clientIdMasked: maskedClientId,
    scopes,
  });

  if (!redirectUri) {
    throw new Error('GOOGLE_REDIRECT_URI environment variable is missing.');
  }

  const oauth2Client = getOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

export async function handleAuthCallback(code: string, sessionId: string = 'default'): Promise<AuthState> {
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  console.log('[Google OAuth Debug] Exchanging authorization code:', {
    hasCode: !!code,
    redirectUriBeingUsed: redirectUri,
  });

  try {
    const oauth2Client = getOAuth2Client();
    console.log('[Google OAuth Debug] Token exchange status: initiating getToken');
    const { tokens } = await oauth2Client.getToken(code);
    console.log('[Google OAuth Debug] Token exchange status: success');
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
    console.error('Error handling Google OAuth callback / Token exchange failed:', error?.response?.data || error);
    const message = error?.response?.data?.error_description || error?.message || 'Failed to authenticate with Google';
    if (message.includes('redirect_uri_mismatch')) {
      throw new Error('Redirect URI mismatch: Please verify GOOGLE_REDIRECT_URI in environment configuration and Google Cloud Console.');
    }
    throw new Error(message);
  }
}

export function handleEmailLogin(email: string, pass: string, sessionId: string = 'default'): AuthState {
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid Gmail / Email address.');
  }
  const name = email.split('@')[0];
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
  const user = {
    id: `email-user-${Date.now()}`,
    name: formattedName,
    email: email,
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  };
  setSessionAuthenticated(sessionId, user, { access_type: 'offline', scope: 'email-login' });
  return {
    authenticated: true,
    isGuest: false,
    user,
  };
}

export function handleDemoGoogleLogin(sessionId: string = 'default'): AuthState {
  const user = {
    id: 'google-demo-user',
    name: 'Piyush (Google Workspace)',
    email: 'piyushwc@gmail.com',
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  };
  setSessionAuthenticated(sessionId, user, { access_type: 'offline', scope: 'workspace-demo' });
  return {
    authenticated: true,
    isGuest: false,
    user,
  };
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

