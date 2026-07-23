import { getSession, logoutSession } from '../memory';
import { getAuthStatus } from '../auth';

export function getAuthMe(sessionId: string = 'default') {
  try {
    const status = getAuthStatus(sessionId);
    return {
      success: true,
      data: {
        authenticated: status.authenticated,
        isGuest: status.isGuest,
        user: status.user || null,
        email: status.user?.email || null,
        profilePicture: status.user?.picture || null,
      },
      error: null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Failed to get authentication status',
    };
  }
}

export function logoutUser(sessionId: string = 'default') {
  try {
    logoutSession(sessionId);
    return {
      success: true,
      data: { loggedOut: true },
      error: null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Failed to logout',
    };
  }
}
