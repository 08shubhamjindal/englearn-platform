// ============================================
// Paper Registry — self-registration system
// ============================================
// Each paper data file calls PaperRegistry.register()
// with its metadata + content. No other files need changes.

const PaperRegistry = {
  _papers: {},       // paperId -> { meta, chapters }
  _catalog: [],      // ordered list for catalog display

  /**
   * Register a paper. Called by each paper data file.
   * @param {Object} meta - Catalog metadata (title, source, category, etc.)
   * @param {Array}  chapters - Array of chapter objects with blocks
   */
  register(meta, chapters) {
    this._papers[meta.id] = { meta, chapters };
    // Avoid duplicates in catalog
    if (!this._catalog.find(p => p.id === meta.id)) {
      this._catalog.push(meta);
    }
  },

  /**
   * Get all papers for the catalog page (ordered by sortOrder, then registration order)
   */
  getAllPapers() {
    return this._catalog.slice().sort((a, b) => {
      // Published papers first, then coming soon
      if (a.comingSoon && !b.comingSoon) return 1;
      if (!a.comingSoon && b.comingSoon) return -1;
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });
  },

  /**
   * Get paper content (chapters + blocks) by ID
   */
  getPaperData(paperId) {
    const entry = this._papers[paperId];
    return entry ? { id: paperId, chapters: entry.chapters } : null;
  },

  /**
   * Get paper catalog metadata by ID
   */
  getPaperMeta(paperId) {
    const entry = this._papers[paperId];
    return entry ? entry.meta : null;
  },

  /**
   * Get count of available (non-coming-soon) papers
   */
  getAvailableCount() {
    return this._catalog.filter(p => !p.comingSoon).length;
  },

  /**
   * Total chapters across all papers
   */
  getTotalChapters() {
    return this._catalog.reduce((sum, p) => sum + (p.chapters || 0), 0);
  }
};
