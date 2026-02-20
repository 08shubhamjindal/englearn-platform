// Main Application
const App = {
  init() {
    Router.init();
    this.render();
  },

  render() {
    const resolved = Router.resolve();
    const appEl = document.getElementById('app');

    switch (resolved.route) {
      case 'paper':
        appEl.innerHTML = ReaderPage.render(resolved.paperId, resolved.chapterIndex);
        window.scrollTo(0, 0);
        break;
      case 'catalog':
      default:
        DiagramRenderer.cleanup();
        appEl.innerHTML = CatalogPage.render();
        break;
    }
  },

  navigate(path) {
    Router.navigate(path);
  },

  navigateToChapter(chapterIndex) {
    const paperId = ReaderPage.currentPaperId;
    if (!paperId) return;

    // Mark current chapter as completed if moving forward
    if (chapterIndex > ReaderPage.currentChapterIndex) {
      ProgressTracker.markChapterComplete(paperId, ReaderPage.currentChapterIndex);
    }

    window.location.hash = `#/paper/${paperId}/${chapterIndex}`;
  },

  completePaper(paperId, lastChapterIndex) {
    ProgressTracker.markChapterComplete(paperId, lastChapterIndex);
    
    // Show completion state
    const container = document.querySelector('.content-container');
    if (container) {
      const footer = container.querySelector('.chapter-footer');
      if (footer) {
        footer.innerHTML = `
          <div class="completion-banner" style="width:100%">
            <div class="completion-banner__icon">🎉</div>
            <div class="completion-banner__title">Paper Completed!</div>
            <div class="completion-banner__text">
              You've finished all chapters. Great job understanding this paper!
            </div>
            <button class="chapter-footer__btn chapter-footer__btn--primary" style="margin-top: 24px; display: inline-flex;" onclick="App.navigate('/')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Browse More Papers
            </button>
          </div>
        `;
      }
    }
  }
};

// Boot — dynamically load all papers, then init
document.addEventListener('DOMContentLoaded', () => {
  PaperLoader.loadAll(() => App.init());
});
