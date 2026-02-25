// Header component
const Header = {
  render(context = 'catalog') {
    const backButton = context === 'reader'
      ? `<button class="header__back-btn" onclick="App.navigate('/')">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
           All Papers
         </button>`
      : '';

    const user = AuthService.getUser();
    const authHtml = user
      ? this._renderUserMenu(user)
      : this._renderLoginButton();

    return `
      <header class="header">
        <a class="header__logo" onclick="App.navigate('/')">
          <div class="header__logo-icon">E</div>
          <span class="header__logo-text">EngLearn</span>
          <span class="header__logo-tag">Beta</span>
        </a>
        <nav class="header__nav">
          ${backButton}
          ${authHtml}
        </nav>
      </header>
    `;
  },

  _renderLoginButton() {
    return `
      <button class="header__login-btn" onclick="AuthService.login()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign in
      </button>
    `;
  },

  _renderUserMenu(user) {
    return `
      <div class="header__user" onclick="Header.toggleUserMenu()">
        <img class="header__avatar" src="${user.avatarUrl || ''}" alt="${user.name}" 
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
        <div class="header__avatar-fallback" style="display:none;">${(user.name || 'U').charAt(0).toUpperCase()}</div>
        <span class="header__username">${user.name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
        <svg class="header__chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div class="header__dropdown" id="userDropdown">
        <div class="header__dropdown-info">
          <div class="header__dropdown-name">${user.name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          <div class="header__dropdown-email">${user.email.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
        <div class="header__dropdown-divider"></div>
        <button class="header__dropdown-item" onclick="AuthService.logout()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign out
        </button>
      </div>
    `;
  },

  toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
      dropdown.classList.toggle('header__dropdown--visible');
    }
    // Close on outside click
    setTimeout(() => {
      const handler = (e) => {
        if (!e.target.closest('.header__user') && !e.target.closest('.header__dropdown')) {
          const dd = document.getElementById('userDropdown');
          if (dd) dd.classList.remove('header__dropdown--visible');
          document.removeEventListener('click', handler);
        }
      };
      document.addEventListener('click', handler);
    }, 0);
  }
};
