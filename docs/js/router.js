// Simple hash-based router
const Router = {
  routes: {},

  register(path, handler) {
    this.routes[path] = handler;
  },

  navigate(path) {
    window.location.hash = '#' + path;
  },

  getCurrentRoute() {
    const hash = window.location.hash.slice(1) || '/';
    return hash;
  },

  resolve() {
    const path = this.getCurrentRoute();

    // Check for paper route: /paper/:id
    const paperMatch = path.match(/^\/paper\/([a-z0-9-]+)$/);
    if (paperMatch) {
      const paperId = paperMatch[1];
      // Check if there's a chapter query
      const progress = ProgressTracker.getProgress(paperId);
      return { route: 'paper', paperId, chapterIndex: progress.currentChapter || 0 };
    }

    // Check for paper+chapter route: /paper/:id/:chapter
    const chapterMatch = path.match(/^\/paper\/([a-z0-9-]+)\/(\d+)$/);
    if (chapterMatch) {
      return { route: 'paper', paperId: chapterMatch[1], chapterIndex: parseInt(chapterMatch[2]) };
    }

    // Default: catalog
    return { route: 'catalog' };
  },

  init() {
    window.addEventListener('hashchange', () => App.render());
    if (!window.location.hash) {
      window.location.hash = '#/';
    }
  }
};
