// Auth Service — handles login state with the backend
const AuthService = {
  _user: null,
  _loaded: false,
  _listeners: [],

  // Backend base URL (change in production)
  API_BASE: 'http://localhost:8080',

  /**
   * Check if user is logged in by calling /api/auth/me
   * Called once on app boot.
   */
  async init() {
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
    window.location.href = `${this.API_BASE}/oauth2/authorization/google`;
  },

  /**
   * Logout — clear cookie via backend, reset state.
   */
  async logout() {
    try {
      await fetch(`${this.API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.warn('Logout request failed.');
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
