// Header component
const Header = {
  render(context = 'catalog') {
    const backButton = context === 'reader'
      ? `<button class="header__back-btn" onclick="App.navigate('/')">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
           All Papers
         </button>`
      : '';

    return `
      <header class="header">
        <a class="header__logo" onclick="App.navigate('/')">
          <div class="header__logo-icon">E</div>
          <span class="header__logo-text">EngLearn</span>
          <span class="header__logo-tag">Beta</span>
        </a>
        <nav class="header__nav">
          ${backButton}
        </nav>
      </header>
    `;
  }
};
