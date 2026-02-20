// Progress tracking via localStorage
const ProgressTracker = {
  _key(paperId) {
    return `englearn_progress_${paperId}`;
  },

  getProgress(paperId) {
    try {
      const data = localStorage.getItem(this._key(paperId));
      return data ? JSON.parse(data) : { completedChapters: [], currentChapter: 0 };
    } catch {
      return { completedChapters: [], currentChapter: 0 };
    }
  },

  saveProgress(paperId, chapterIndex) {
    const progress = this.getProgress(paperId);
    progress.currentChapter = chapterIndex;
    if (!progress.completedChapters.includes(chapterIndex)) {
      progress.completedChapters.push(chapterIndex);
    }
    localStorage.setItem(this._key(paperId), JSON.stringify(progress));
  },

  markChapterComplete(paperId, chapterIndex) {
    const progress = this.getProgress(paperId);
    if (!progress.completedChapters.includes(chapterIndex)) {
      progress.completedChapters.push(chapterIndex);
    }
    localStorage.setItem(this._key(paperId), JSON.stringify(progress));
  },

  getPercentage(paperId, totalChapters) {
    const progress = this.getProgress(paperId);
    if (totalChapters === 0) return 0;
    return Math.round((progress.completedChapters.length / totalChapters) * 100);
  },

  isChapterCompleted(paperId, chapterIndex) {
    const progress = this.getProgress(paperId);
    return progress.completedChapters.includes(chapterIndex);
  }
};
