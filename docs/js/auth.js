// Auth Service — handles login state with the backend
const AuthService = {
  _user: null,
  _loaded: false,
  _listeners: [],

  // Backend base URL — auto-detect: skip auth calls if no backend is configured
  // Set this to your real backend URL in production (e.g., 'https://api.englearn.com')
  API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080'
    : '',  // Empty = no backend, run in guest mode

  /**
   * Check if user is logged in by calling /api/auth/me
   * Called once on app boot.
   */
  async init() {
    // Skip if no backend configured (e.g., on GitHub Pages without backend)
    if (!this.API_BASE) {
      this._loaded = true;
      return;
    }

    try {
      const res = await fetch(`${this.API_BASE}/api/auth/me`, {
        credentials: 'include'  // Send cookies
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          this._user = data.user;
        }
      }
    } catch (e) {
      // Backend not running — continue as guest
      console.warn('Auth service unavailable, running in guest mode.');
    }
    this._loaded = true;
    this._notifyListeners();
  },

  /**
   * Redirect to Google login via backend.
   */
  login() {
    if (!this.API_BASE) {
      alert('Backend is not configured yet. Sign in will be available soon!');
      return;
    }
    window.location.href = `${this.API_BASE}/oauth2/authorization/google`;
  },

  /**
   * Logout — clear cookie via backend, reset state.
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
    this._user = null;
    this._notifyListeners();
    App.render();
  },

  /**
   * Get current user (null if not logged in).
   */
  getUser() {
    return this._user;
  },

  /**
   * Check if user is authenticated.
   */
  isLoggedIn() {
    return this._user !== null;
  },

  /**
   * Subscribe to auth state changes.
   */
  onAuthChange(callback) {
    this._listeners.push(callback);
  },

  _notifyListeners() {
    this._listeners.forEach(cb => cb(this._user));
  }
};
