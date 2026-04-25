/**
 * Firebase Authentication Module — Porky's Meat Market
 *
 * ── FIREBASE CONSOLE SETUP (one-time, required) ─────────────────────────────
 * 1. https://console.firebase.google.com/project/porky-s-1c369
 * 2. Authentication → Sign-in method → Enable "Google" and "Email/Password"
 * 3. Authentication → Settings → Authorised domains → add your domain + localhost
 * ────────────────────────────────────────────────────────────────────────────
 */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDx-EFaGG1pZRTON3Nsd8G4END47-X1k9w",
  authDomain:        "porky-s-1c369.firebaseapp.com",
  projectId:         "porky-s-1c369",
  storageBucket:     "porky-s-1c369.firebasestorage.app",
  messagingSenderId: "162763180987",
  appId:             "1:162763180987:web:c746d71954b4c0cc6a929e",
  measurementId:     "G-8Q6379YQL0"
};

const FirebaseAuth = {
  _auth:  null,
  _ready: false,

  /* ── Init — called once after SDK + Auth module are both loaded ── */
  init: () => {
    if (typeof firebase === 'undefined') {
      console.warn('[FirebaseAuth] Firebase SDK not loaded.');
      return;
    }
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      FirebaseAuth._auth  = firebase.auth();
      FirebaseAuth._ready = true;
      console.log('[FirebaseAuth] Ready ✓');
    } catch (err) {
      console.warn('[FirebaseAuth] Init error:', err.message);
    }
  },

  isAvailable: () => FirebaseAuth._ready && FirebaseAuth._auth !== null,

  /* ── Helper: build session from Firebase user ── */
  _session: (fbUser, extra) => ({
    id:        fbUser.uid,
    firstname: extra?.firstname || (fbUser.displayName || fbUser.email.split('@')[0]).split(' ')[0],
    lastname:  extra?.lastname  || (fbUser.displayName || '').split(' ').slice(1).join(' ') || '',
    name:      fbUser.displayName || fbUser.email,
    email:     fbUser.email,
    phone:     extra?.phone || '',
    avatar:    fbUser.photoURL || '',
    provider:  extra?.provider || 'firebase',
    role:      'customer'
  }),

  /* ── Google Sign-In ── */
  signInWithGoogle: async () => {
    if (!FirebaseAuth.isAvailable()) {
      return { success: false, error: 'Firebase not ready. Please refresh and try again.' };
    }
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result  = await FirebaseAuth._auth.signInWithPopup(provider);
      const session = FirebaseAuth._session(result.user, { provider: 'google' });
      Auth._saveSession(session);
      Auth._emit('loggedIn', session);
      return { success: true, user: session };
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' ||
          err.code === 'auth/cancelled-popup-request') {
        return { success: false, cancelled: true };
      }
      return { success: false, error: FirebaseAuth._msg(err.code) };
    }
  },

  /* ── Email/Password Sign-In ──
   * Tries Firebase first; if the account doesn't exist in Firebase
   * (e.g. was created via localStorage fallback), falls back to localStorage. */
  signInWithEmail: async (email, password) => {
    if (!FirebaseAuth.isAvailable()) {
      return Auth.login(email, password);
    }
    try {
      const result  = await FirebaseAuth._auth.signInWithEmailAndPassword(email, password);
      const session = FirebaseAuth._session(result.user, { provider: 'email' });
      Auth._saveSession(session);
      Auth._emit('loggedIn', session);
      return { success: true, user: session };
    } catch (err) {
      // If Firebase doesn't know this user, fall back to localStorage auth
      if (err.code === 'auth/user-not-found' ||
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/invalid-email') {
        console.log('[FirebaseAuth] Falling back to localStorage auth for:', email);
        return Auth.login(email, password);
      }
      return { success: false, error: FirebaseAuth._msg(err.code) };
    }
  },

  /* ── Email/Password Register ──
   * Tries Firebase first; falls back to localStorage if Firebase fails. */
  registerWithEmail: async ({ firstname, lastname, email, phone, password }) => {
    if (!FirebaseAuth.isAvailable()) {
      return Auth.register({ firstname, lastname, email, phone, password });
    }
    try {
      const result = await FirebaseAuth._auth.createUserWithEmailAndPassword(email, password);
      await result.user.updateProfile({ displayName: firstname + ' ' + lastname });
      const session = FirebaseAuth._session(result.user, { firstname, lastname, phone, provider: 'email' });
      Auth._saveSession(session);
      Auth._emit('registered', session);
      return { success: true, user: session };
    } catch (err) {
      // If email already exists in Firebase, try signing in instead
      if (err.code === 'auth/email-already-in-use') {
        return { success: false, error: 'An account with this email already exists. Please sign in.' };
      }
      // For other Firebase errors, fall back to localStorage
      console.warn('[FirebaseAuth] Register fallback to localStorage:', err.code);
      return Auth.register({ firstname, lastname, email, phone, password });
    }
  },

  /* ── Password Reset ── */
  sendPasswordReset: async (email) => {
    if (!FirebaseAuth.isAvailable()) return { success: false };
    try {
      await FirebaseAuth._auth.sendPasswordResetEmail(email);
      return { success: true };
    } catch {
      return { success: true }; // don't reveal if email exists
    }
  },

  /* ── Friendly error messages ── */
  _msg: (code) => ({
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password. Please try again.',
    'auth/invalid-credential':     'Incorrect email or password.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/email-already-in-use':   'An account with this email already exists.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/too-many-requests':      'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/user-disabled':          'This account has been disabled.',
    'auth/popup-blocked':          'Popup was blocked. Please allow popups for this site.'
  })[code] || 'Something went wrong. Please try again.'
};

// Initialise immediately — by the time this script runs, Firebase SDK
// is already loaded (synchronous <script> tags in <head>) and Auth is
// defined (loaded before this file in the <body> scripts).
FirebaseAuth.init();
