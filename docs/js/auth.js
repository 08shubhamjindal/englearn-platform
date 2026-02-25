// Auth Service — localStorage-based with one-time API call on login callback
//
// Design:
//   Normal page load → reads localStorage (instant, zero API calls)
//   After Google login redirect (?auth=success) → calls /api/auth/me ONCE → saves to localStorage
//   Protected actions → local expiry check; backend JWT validates the actual request
//   401 from any API → clears localStorage, prompts re-login

const AuthService = {
  _user: null,
  _listeners: [],

  // Backend base URL — auto-detect: empty = no backend (GitHub Pages guest mode)
  API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080'
    : '',

  STORAGE_KEY: 'englearn_user',

  // ───────────────────────────── Boot ─────────────────────────────

  /**
   * Called once on app start.
   * - Login callback (?auth=success): fetches user info from backend, saves to localStorage.
   * - Normal page load: reads localStorage synchronously.
   */
  async init() {
    const params = new URLSearchParams(window.location.search);

    if (params.get('auth') === 'success' && this.API_BASE) {
      await this._handleLoginCallback();
      // Remove ?auth=success from the URL bar without triggering a reload
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      return;
    }

    // Fast path — read cached user from localStorage
    this._loadFromStorage();
  },

  // ───────────────────────── Login callback ───────────────────────

  /**
   * One-time API call after OAuth redirect.
   * Fetches user info from /api/auth/me and persists to localStorage.
   */
  async _handleLoginCallback() {
    try {
      const res = await fetch(`${this.API_BASE}/api/auth/me`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          const userInfo = {
            name:        data.user.name,
            email:       data.user.email,
            avatarUrl:   data.user.avatarUrl,
            role:        data.user.role,
            tokenExpiry: data.tokenExpiry   // Unix ms — mirrors JWT exp claim
          };
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userInfo));
          this._user = userInfo;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch user info after login.');
    }
    this._notifyListeners();
  },

  // ────────────────────── localStorage helpers ────────────────────

  /**
   * Read user from localStorage. Clears if expired.
   */
  _loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const user = JSON.parse(stored);

      // If token has expired, discard cached user
      if (user.tokenExpiry && Date.now() > user.tokenExpiry) {
        localStorage.removeItem(this.STORAGE_KEY);
        return;
      }

      this._user = user;
    } catch (e) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  },

  // ──────────────────────── Public actions ─────────────────────────

  /**
   * Redirect to Google login via backend OAuth2 flow.
   */
  login() {
    if (!this.API_BASE) {
      alert('Backend is not configured yet. Sign in will be available soon!');
      return;
    }
    window.location.href = `${this.API_BASE}/oauth2/authorization/google`;
  },

  /**
   * Logout — clear HttpOnly cookie on backend + clear localStorage.
   */
  async logout() {
    if (this.API_BASE) {
      try {
        await fetch(`${this.API_BASE}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch (e) {
        console.warn('Logout request failed.');
      }
    }
    this._clearAuth();
    App.render();
  },

  // ──────────────────── Auth state accessors ──────────────────────

  /** Get current user (null if guest). */
  getUser() {
    return this._user;
  },

  /** True if user is logged in (based on localStorage). */
  isLoggedIn() {
    return this._user !== null;
  },

  // ─────────────────── Protected-action guard ─────────────────────

  /**
   * Call before any protected action (post comment, save progress, submit quiz).
   * Does a fast local check — no API call. The backend JWT validates the real request.
   * Returns true  → proceed with the action.
   * Returns false → user was redirected to login (or shown an alert).
   */
  requireAuth() {
    if (!this.API_BASE) {
      alert('Sign in will be available once the backend is deployed.');
      return false;
    }
    if (!this._user) {
      this.login();
      return false;
    }
    if (this._user.tokenExpiry && Date.now() > this._user.tokenExpiry) {
      this._clearAuth();
      this.login();
      return false;
    }
    return true;
  },

  /**
   * Call when any protected API returns 401.
   * Clears auth state and prompts the user to sign in again.
   */
  handleUnauthorized() {
    this._clearAuth();
    alert('Your session has expired. Please sign in again.');
    App.render();
  },

  // ──────────────────────── Internals ─────────────────────────────

  _clearAuth() {
    this._user = null;
    localStorage.removeItem(this.STORAGE_KEY);
    this._notifyListeners();
  },

  /** Subscribe to auth state changes. */
  onAuthChange(callback) {
    this._listeners.push(callback);
  },

  _notifyListeners() {
    this._listeners.forEach(cb => cb(this._user));
  }
};
