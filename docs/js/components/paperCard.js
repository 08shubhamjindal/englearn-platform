// Paper Card component for catalog
const PaperCard = {
  render(paper) {
    const progress = ProgressTracker.getPercentage(paper.id, paper.chapters);
    const isComingSoon = paper.comingSoon;
    
    return `
      <div class="paper-card ${isComingSoon ? 'paper-card--disabled' : ''}" 
           onclick="${isComingSoon ? '' : `App.navigate('/paper/${paper.id}')`}">
        <div class="paper-card__category paper-card__category--${paper.category}">
          ${paper.categoryLabel}
        </div>
        <h3 class="paper-card__title">${paper.title}</h3>
        <div class="paper-card__source">${paper.source}</div>
        <p class="paper-card__description">${paper.description}</p>
        <div class="paper-card__footer">
          <div class="paper-card__meta">
            <span class="paper-card__meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              ${paper.chapters} chapters
            </span>
            <span class="paper-card__meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              ${paper.readTime}
            </span>
            <span class="paper-card__meta-item">
              ${paper.difficulty}
            </span>
          </div>
          ${isComingSoon ? '<span class="paper-card__badge--coming-soon">Coming Soon</span>' : ''}
          ${!isComingSoon && progress > 0 ? `
            <div class="paper-card__progress">
              <div class="paper-card__progress-bar">
                <div class="paper-card__progress-fill" style="width: ${progress}%"></div>
              </div>
              <span>${progress}%</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
};
