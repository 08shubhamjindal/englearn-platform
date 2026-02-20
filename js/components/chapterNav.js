// Chapter Navigation Sidebar
const ChapterNav = {
  render(paper, chapters, currentChapterIndex, paperId) {
    const progress = ProgressTracker.getProgress(paperId);
    const percentage = ProgressTracker.getPercentage(paperId, chapters.length);

    let chaptersHtml = chapters.map((ch, i) => {
      const isActive = i === currentChapterIndex;
      const isCompleted = progress.completedChapters.includes(i);
      let classes = 'chapter-nav__item';
      if (isActive) classes += ' chapter-nav__item--active';
      if (isCompleted && !isActive) classes += ' chapter-nav__item--completed';

      return `
        <div class="${classes}" onclick="App.navigateToChapter(${i})">
          <div class="chapter-nav__number">${isCompleted && !isActive ? '&#10003;' : ch.number}</div>
          <div>
            <div class="chapter-nav__title">${ch.title}</div>
            <div class="chapter-nav__duration">${ch.duration}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <aside class="reader__sidebar">
        <div class="reader__sidebar-header">
          <div class="reader__paper-title">${paper.title}</div>
          <div class="reader__paper-progress">
            <div class="reader__paper-progress-bar">
              <div class="reader__paper-progress-fill" style="width: ${percentage}%"></div>
            </div>
            <span>${percentage}% complete</span>
          </div>
        </div>
        ${chaptersHtml}
      </aside>
    `;
  }
};
