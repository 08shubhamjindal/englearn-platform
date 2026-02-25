// Reader Page — renders a paper with chapter navigation
const ReaderPage = {
  currentPaperId: null,
  currentChapterIndex: 0,

  render(paperId, chapterIndex = 0) {
    this.currentPaperId = paperId;
    this.currentChapterIndex = chapterIndex;

    // Get paper data from registry
    const paperData = PaperRegistry.getPaperData(paperId);
    const paperMeta = PaperRegistry.getPaperMeta(paperId);

    if (!paperData || !paperMeta) {
      return `
        ${Header.render('reader')}
        <main class="catalog" style="text-align:center; padding-top: 200px;">
          <h2 style="color: var(--text-heading);">Paper not found</h2>
          <p style="color: var(--text-secondary); margin-top: 8px;">This paper hasn't been published yet.</p>
        </main>
      `;
    }

    const chapters = paperData.chapters;
    const chapter = chapters[chapterIndex];

    // Cleanup existing diagram auto-play intervals
    DiagramRenderer.cleanup();
    BlockRenderer.resetCounter();

    // Mark as current progress
    ProgressTracker.saveProgress(paperId, chapterIndex);

    // Render blocks
    const blocksHtml = chapter.blocks.map(block => BlockRenderer.render(block, paperId)).join('');

    // Navigation footer
    const prevChapter = chapterIndex > 0 ? chapters[chapterIndex - 1] : null;
    const nextChapter = chapterIndex < chapters.length - 1 ? chapters[chapterIndex + 1] : null;
    const isLastChapter = chapterIndex === chapters.length - 1;

    let footerHtml = `<div class="chapter-footer">`;
    if (prevChapter) {
      footerHtml += `
        <button class="chapter-footer__btn" onclick="App.navigateToChapter(${chapterIndex - 1})">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          <div>
            <div class="chapter-footer__btn-label">Previous</div>
            <div class="chapter-footer__btn-title">${prevChapter.title}</div>
          </div>
        </button>`;
    } else {
      footerHtml += `<div></div>`;
    }

    if (nextChapter) {
      footerHtml += `
        <button class="chapter-footer__btn chapter-footer__btn--primary" onclick="App.navigateToChapter(${chapterIndex + 1})">
          <div>
            <div class="chapter-footer__btn-label">Next Chapter</div>
            <div class="chapter-footer__btn-title">${nextChapter.title}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>`;
    } else {
      // Last chapter — mark complete
      footerHtml += `
        <button class="chapter-footer__btn chapter-footer__btn--primary" onclick="App.completePaper('${paperId}', ${chapterIndex})">
          <div>
            <div class="chapter-footer__btn-label">Finish</div>
            <div class="chapter-footer__btn-title">Complete Paper</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
        </button>`;
    }

    footerHtml += `</div>`;

    const html = `
      ${Header.render('reader')}
      <div class="reader">
        ${ChapterNav.render(paperMeta, chapters, chapterIndex, paperId)}
        <div class="reader__content">
          <div class="content-container">
            <div class="chapter-header animate-fade-in">
              <div class="chapter-header__number">Chapter ${chapter.number} · ${chapter.duration}</div>
              <h1 class="chapter-header__title">${chapter.title}</h1>
              <p class="chapter-header__subtitle">${chapter.subtitle}</p>
            </div>
            ${blocksHtml}
            ${footerHtml}
            ${CommentSection.render(paperId, chapterIndex)}
          </div>
        </div>
      </div>
    `;

    // Load comments after DOM render (next tick)
    setTimeout(() => CommentSection.init(paperId, chapterIndex), 0);

    return html;
  },

  // No longer needed — PaperRegistry handles all paper lookups dynamically
};
