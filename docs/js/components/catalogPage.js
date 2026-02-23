// Catalog / Landing Page with Search, Filters, Continue Learning
const CatalogPage = {
  _activeCategory: 'all',
  _activeDifficulty: 'all',
  _searchQuery: '',
  _sortBy: 'default',

  render() {
    const allPapers = PaperRegistry.getAllPapers();
    const availableCount = PaperRegistry.getAvailableCount();
    const totalChapters = PaperRegistry.getTotalChapters();

    // Gather unique categories
    const categories = [...new Set(allPapers.map(p => p.category))];
    const categoryLabels = {};
    allPapers.forEach(p => { categoryLabels[p.category] = p.categoryLabel; });

    // Gather unique difficulty levels
    const difficulties = [...new Set(allPapers.filter(p => p.difficulty).map(p => p.difficulty))];

    // Find in-progress papers (started but not completed)
    const inProgressPapers = allPapers.filter(p => {
      if (p.comingSoon) return false;
      const pct = ProgressTracker.getPercentage(p.id, p.chapters);
      return pct > 0 && pct < 100;
    });

    // Apply filters to get displayed papers
    const filteredPapers = this._getFilteredPapers(allPapers);

    return `
      ${Header.render('catalog')}
      <main class="catalog">
        <!-- HERO -->
        <section class="catalog__hero">
          <div class="catalog__badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Engineering Papers, Simplified
          </div>
          <h1 class="catalog__title">
            Stop Reading Papers.<br/>
            Start <span>Understanding</span> Them.
          </h1>
          <p class="catalog__subtitle">
            We transform dense engineering papers and blogs into structured, visual, 
            interactive learning experiences. Chapter by chapter, diagram by diagram.
          </p>
          <div class="catalog__stats">
            <div class="catalog__stat">
              <div class="catalog__stat-value">${allPapers.length}</div>
              <div class="catalog__stat-label">Papers</div>
            </div>
            <div class="catalog__stat">
              <div class="catalog__stat-value">${totalChapters}</div>
              <div class="catalog__stat-label">Chapters</div>
            </div>
            <div class="catalog__stat">
              <div class="catalog__stat-value">${availableCount}</div>
              <div class="catalog__stat-label">Available Now</div>
            </div>
          </div>
        </section>

        <!-- CONTINUE LEARNING -->
        ${inProgressPapers.length > 0 ? `
          <section class="catalog__section">
            <h2 class="catalog__section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              Continue Learning
            </h2>
            <div class="catalog__continue-grid">
              ${inProgressPapers.map(p => CatalogPage._renderContinueCard(p)).join('')}
            </div>
          </section>
        ` : ''}

        <!-- SEARCH + FILTERS -->
        <section class="catalog__section">
          <h2 class="catalog__section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            All Papers
            <span class="catalog__result-count">${filteredPapers.length} of ${allPapers.length}</span>
          </h2>

          <!-- Search Bar -->
          <div class="catalog__search-bar">
            <svg class="catalog__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              class="catalog__search-input"
              placeholder="Search papers by title, topic, or keyword..."
              value="${this._searchQuery}"
              oninput="CatalogPage.onSearch(this.value)"
            />
            ${this._searchQuery ? `
              <button class="catalog__search-clear" onclick="CatalogPage.onSearch('')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            ` : ''}
          </div>

          <!-- Filter Bar -->
          <div class="catalog__filters">
            <div class="catalog__filter-group">
              <span class="catalog__filter-label">Category</span>
              <div class="catalog__filter-chips">
                <button class="catalog__chip ${this._activeCategory === 'all' ? 'catalog__chip--active' : ''}"
                        onclick="CatalogPage.filterByCategory('all')">All</button>
                ${categories.map(c => `
                  <button class="catalog__chip ${this._activeCategory === c ? 'catalog__chip--active' : ''}"
                          onclick="CatalogPage.filterByCategory('${c}')">${categoryLabels[c]}</button>
                `).join('')}
              </div>
            </div>
            <div class="catalog__filter-group">
              <span class="catalog__filter-label">Difficulty</span>
              <div class="catalog__filter-chips">
                <button class="catalog__chip ${this._activeDifficulty === 'all' ? 'catalog__chip--active' : ''}"
                        onclick="CatalogPage.filterByDifficulty('all')">All</button>
                ${difficulties.map(d => `
                  <button class="catalog__chip ${this._activeDifficulty === d ? 'catalog__chip--active' : ''}"
                          onclick="CatalogPage.filterByDifficulty('${d}')">${d}</button>
                `).join('')}
              </div>
            </div>
            <div class="catalog__filter-group">
              <span class="catalog__filter-label">Sort</span>
              <select class="catalog__sort-select" onchange="CatalogPage.sortBy(this.value)">
                <option value="default" ${this._sortBy === 'default' ? 'selected' : ''}>Default</option>
                <option value="title" ${this._sortBy === 'title' ? 'selected' : ''}>A &rarr; Z</option>
                <option value="difficulty" ${this._sortBy === 'difficulty' ? 'selected' : ''}>Easiest First</option>
                <option value="readTime" ${this._sortBy === 'readTime' ? 'selected' : ''}>Shortest First</option>
                <option value="chapters" ${this._sortBy === 'chapters' ? 'selected' : ''}>Fewest Chapters</option>
              </select>
            </div>
          </div>

          <!-- Results Grid -->
          ${filteredPapers.length > 0 ? `
            <div class="catalog__grid">
              ${filteredPapers.map(p => PaperCard.render(p)).join('')}
            </div>
          ` : `
            <div class="catalog__empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <h3>No papers found</h3>
              <p>Try adjusting your search or filters</p>
              <button class="catalog__chip catalog__chip--active" onclick="CatalogPage.resetFilters()">Reset All Filters</button>
            </div>
          `}
        </section>
      </main>
    `;
  },

  // Continue Learning card (compact horizontal)
  _renderContinueCard(paper) {
    const pct = ProgressTracker.getPercentage(paper.id, paper.chapters);
    const progress = ProgressTracker.getProgress(paper.id);
    const currentCh = (progress.currentChapter || 0) + 1;

    return `
      <div class="continue-card" onclick="App.navigate('/paper/${paper.id}')">
        <div class="continue-card__accent continue-card__accent--${paper.category}"></div>
        <div class="continue-card__body">
          <div class="continue-card__category">${paper.categoryLabel}</div>
          <h3 class="continue-card__title">${paper.title}</h3>
          <div class="continue-card__progress">
            <div class="continue-card__progress-bar">
              <div class="continue-card__progress-fill" style="width: ${pct}%"></div>
            </div>
            <span class="continue-card__progress-text">Chapter ${currentCh} of ${paper.chapters} &middot; ${pct}%</span>
          </div>
        </div>
        <div class="continue-card__action">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>
    `;
  },

  // Filter logic
  _getFilteredPapers(allPapers) {
    let papers = allPapers;

    // Search filter
    if (this._searchQuery.trim()) {
      const q = this._searchQuery.toLowerCase();
      papers = papers.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q) ||
        (p.source && p.source.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (this._activeCategory !== 'all') {
      papers = papers.filter(p => p.category === this._activeCategory);
    }

    // Difficulty filter
    if (this._activeDifficulty !== 'all') {
      papers = papers.filter(p => p.difficulty === this._activeDifficulty);
    }

    // Sort
    return this._sortPapers(papers);
  },

  _sortPapers(papers) {
    const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
    switch (this._sortBy) {
      case 'title':
        return [...papers].sort((a, b) => a.title.localeCompare(b.title));
      case 'difficulty':
        return [...papers].sort((a, b) => (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0));
      case 'readTime':
        return [...papers].sort((a, b) => parseInt(a.readTime) - parseInt(b.readTime));
      case 'chapters':
        return [...papers].sort((a, b) => a.chapters - b.chapters);
      default:
        return papers;
    }
  },

  // Event handlers
  onSearch(value) {
    this._searchQuery = value;
    App.render();
  },

  filterByCategory(category) {
    this._activeCategory = category;
    App.render();
  },

  filterByDifficulty(difficulty) {
    this._activeDifficulty = difficulty;
    App.render();
  },

  sortBy(value) {
    this._sortBy = value;
    App.render();
  },

  resetFilters() {
    this._activeCategory = 'all';
    this._activeDifficulty = 'all';
    this._searchQuery = '';
    this._sortBy = 'default';
    App.render();
  }
};
