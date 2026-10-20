import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export const GOOGLE_MEET_SCOPES = [
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/meetings.space.readonly',
  'https://www.googleapis.com/auth/meetings.space.settings'
];

export interface GoogleMeetSpace {
  name: string; // e.g. "spaces/123456789"
  meetingUri: string; // e.g. "https://meet.google.com/abc-defg-hij"
  meetingCode: string; // e.g. "abc-defg-hij"
  config?: {
    accessType?: 'ACCESS_TYPE_UNSPECIFIED' | 'OPEN' | 'TRUSTED' | 'RESTRICTED';
    entryPointAccess?: string;
  };
  activeConference?: {
    conferenceRecord?: string;
  };
}

// In-memory cache for OAuth access token (per guidelines: NEVER localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Clear cached token if user signs out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

const meetProvider = new GoogleAuthProvider();
GOOGLE_MEET_SCOPES.forEach(scope => {
  meetProvider.addScope(scope);
});

/**
 * Initiates Google OAuth popup with Google Meet scopes and caches token in memory
 */
export async function signInWithGoogleMeet(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, meetProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('تعذر استخراج رمز الوصول (Access Token) من مصادقة Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err: any) {
    console.error('Google Meet sign in error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Returns currently cached access token
 */
export function getGoogleMeetAccessToken(): string | null {
  return cachedAccessToken;
}

/**
 * Checks whether user has an active in-memory Google Meet token
 */
export function hasGoogleMeetToken(): boolean {
  return !!cachedAccessToken;
}

/**
 * Signs out and clears cached token
 */
export function signOutGoogleMeet(): void {
  cachedAccessToken = null;
}

/**
 * Creates a new Google Meet space using Google Meet REST API v2
 * Requires meeting creation authorization
 */
export async function createGoogleMeetingSpace(options?: {
  accessType?: 'OPEN' | 'TRUSTED' | 'RESTRICTED';
}): Promise<GoogleMeetSpace> {
  let token = cachedAccessToken;
  if (!token) {
    // Attempt sign in if token is not available
    const authResult = await signInWithGoogleMeet();
    token = authResult.accessToken;
  }

  const accessType = options?.accessType || 'OPEN';

  const response = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      config: {
        accessType: accessType,
      },
    }),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }

    // If 401 Unauthorized, token expired or needs re-auth
    if (response.status === 401) {
      cachedAccessToken = null;
      throw new Error('انتهت صلاحية جلسة Google Meet، يرجى تسجيل الدخول مجدداً.');
    }

    throw new Error(`فشل إنشاء قاعة Google Meet: ${errorDetail}`);
  }

  const data: GoogleMeetSpace = await response.json();
  return data;
}

/**
 * Retrieves details of an existing Google Meet space
 */
export async function getGoogleMeetingSpace(spaceName: string): Promise<GoogleMeetSpace> {
  const token = cachedAccessToken;
  if (!token) {
    throw new Error('يلزم تسجيل الدخول بحساب Google لعرض بيانات القاعة.');
  }

  const cleanName = spaceName.startsWith('spaces/') ? spaceName : `spaces/${spaceName}`;
  const response = await fetch(`https://meet.googleapis.com/v2/${cleanName}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`تعذر جلب بيانات قاعة Google Meet: ${response.statusText}`);
  }

  return response.json();
}
