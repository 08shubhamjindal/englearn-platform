// Comment Section — renders discussion thread under each chapter
const CommentSection = {

  _currentPage: 0,
  _pageSize: 5,
  _hasMore: true,

  /**
   * Render the comment section for a paper chapter.
   */
  render(paperId, chapterIndex) {
    return `
      <section class="comments" id="commentSection">
        <div class="comments__header">
          <h3 class="comments__title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Discussion
          </h3>
          <span class="comments__count" id="commentCount"></span>
        </div>

        ${this._renderCommentBox(paperId, chapterIndex)}

        <div class="comments__list" id="commentList">
          <div class="comments__loading">Loading comments...</div>
        </div>
      </section>
    `;
  },

  /**
   * Initialize — load comments from backend after DOM is ready.
   */
  init(paperId, chapterIndex) {
    this._currentPage = 0;
    this._hasMore = true;
    this._loadComments(paperId, chapterIndex, false);
  },

  // ────────────────────── Comment input box ──────────────────────

  _renderCommentBox(paperId, chapterIndex) {
    const user = AuthService.getUser();

    if (!user) {
      return `
        <div class="comments__login-prompt">
          <p>Sign in to join the discussion</p>
          <button class="comments__login-btn" onclick="AuthService.login()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      `;
    }

    return `
      <div class="comments__compose">
        <img class="comments__compose-avatar" src="${user.avatarUrl || ''}"
             alt="${user.name}"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
        <div class="comments__compose-avatar-fallback" style="display:none;">
          ${(user.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div class="comments__compose-input-wrap">
          <textarea class="comments__compose-input" id="commentInput"
                    placeholder="Share your thoughts on this chapter..."
                    rows="1"
                    oninput="CommentSection._autoResize(this)"></textarea>
          <div class="comments__compose-actions" id="commentActions" style="display:none;">
            <span class="comments__char-count" id="charCount">0 / 5000</span>
            <div>
              <button class="comments__cancel-btn"
                      onclick="CommentSection._cancelCompose()">Cancel</button>
              <button class="comments__submit-btn" id="submitCommentBtn"
                      onclick="CommentSection._submitComment('${paperId}', ${chapterIndex})">
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ────────────────────── Load & render comments ──────────────────

  async _loadComments(paperId, chapterIndex, append = false) {
    const listEl = document.getElementById('commentList');
    const countEl = document.getElementById('commentCount');
    if (!listEl) return;

    // If no backend, show offline message
    if (!AuthService.API_BASE) {
      listEl.innerHTML = `<div class="comments__empty">Comments will be available once the backend is deployed.</div>`;
      if (countEl) countEl.textContent = '';
      return;
    }

    if (!append) {
      listEl.innerHTML = `<div class="comments__loading">Loading comments...</div>`;
    }

    try {
      const res = await fetch(
        `${AuthService.API_BASE}/api/comments/${paperId}/${chapterIndex}?page=${this._currentPage}&size=${this._pageSize}`,
        { credentials: 'include' }
      );

      if (!res.ok) throw new Error('Failed to load comments');
      const comments = await res.json();

      // Update total count (only on first load)
      if (!append && countEl) {
        try {
          const countRes = await fetch(
            `${AuthService.API_BASE}/api/comments/${paperId}/${chapterIndex}/count`,
            { credentials: 'include' }
          );
          if (countRes.ok) {
            const { count } = await countRes.json();
            countEl.textContent = count === 0 ? '' : `${count} comment${count !== 1 ? 's' : ''}`;
          }
        } catch (e) { /* ignore count error */ }
      }

      // Check if there are more pages
      this._hasMore = comments.length === this._pageSize;

      if (comments.length === 0 && !append) {
        listEl.innerHTML = `
          <div class="comments__empty">
            No comments yet. Be the first to share your thoughts!
          </div>`;
        return;
      }

      const commentsHtml = comments.map(c => this._renderComment(c, paperId, chapterIndex)).join('');

      // Remove existing "Load more" button if present
      const existingLoadMore = document.getElementById('loadMoreComments');
      if (existingLoadMore) existingLoadMore.remove();

      if (append) {
        listEl.insertAdjacentHTML('beforeend', commentsHtml);
      } else {
        listEl.innerHTML = commentsHtml;
      }

      // Add "Load more" button if there are more
      if (this._hasMore) {
        listEl.insertAdjacentHTML('beforeend', `
          <button class="comments__load-more" id="loadMoreComments"
                  onclick="CommentSection._loadMore('${paperId}', ${chapterIndex})">
            Load more comments
          </button>
        `);
      }
    } catch (e) {
      console.warn('Failed to load comments:', e);
      if (!append) {
        listEl.innerHTML = `<div class="comments__empty">Could not load comments.</div>`;
        if (countEl) countEl.textContent = '';
      }
    }
  },

  _loadMore(paperId, chapterIndex) {
    this._currentPage++;
    this._loadComments(paperId, chapterIndex, true);
  },

  _renderComment(comment, paperId, chapterIndex, isReply = false) {
    const timeAgo = this._timeAgo(comment.createdAt);
    const user = AuthService.getUser();
    const canDelete = comment.canDelete;
    const isDeleted = comment.deleted;

    const repliesHtml = comment.replies && comment.replies.length > 0
      ? comment.replies.map(r => this._renderComment(r, paperId, chapterIndex, true)).join('')
      : '';

    const replyToggle = !isReply && comment.replyCount > 0 && (!comment.replies || comment.replies.length === 0)
      ? `<button class="comments__show-replies" onclick="CommentSection._loadReplies('${comment.id}', '${paperId}', ${chapterIndex})">
           Show ${comment.replyCount} repl${comment.replyCount === 1 ? 'y' : 'ies'}
         </button>`
      : '';

    return `
      <div class="comments__item ${isReply ? 'comments__item--reply' : ''} ${isDeleted ? 'comments__item--deleted' : ''}" data-id="${comment.id}">
        <div class="comments__item-main">
          ${isDeleted ? `
          <div class="comments__item-avatar-fallback" style="display:flex; opacity:0.4;">?</div>
          ` : `
          <img class="comments__item-avatar" src="${comment.authorAvatarUrl || ''}"
               alt="${comment.authorName}"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
          <div class="comments__item-avatar-fallback" style="display:none;">
            ${(comment.authorName || 'U').charAt(0).toUpperCase()}
          </div>
          `}
          <div class="comments__item-body">
            <div class="comments__item-meta">
              <span class="comments__item-author" ${isDeleted ? 'style="opacity:0.5; font-style:italic;"' : ''}>${isDeleted ? '[deleted]' : this._escapeHtml(comment.authorName)}</span>
              <span class="comments__item-time">${timeAgo}</span>
            </div>
            <div class="comments__item-content" ${isDeleted ? 'style="opacity:0.5; font-style:italic;"' : ''}>${isDeleted ? '[deleted]' : this._escapeHtml(comment.content)}</div>
            ${!isDeleted ? `
            <div class="comments__item-actions">
              ${!isReply && user ? `<button class="comments__action-btn" onclick="CommentSection._showReplyBox('${comment.id}', '${paperId}', ${chapterIndex})">Reply</button>` : ''}
              ${canDelete ? `<button class="comments__action-btn comments__action-btn--delete" onclick="CommentSection._deleteComment('${comment.id}', '${paperId}', ${chapterIndex})">Delete</button>` : ''}
            </div>
            ` : ''}
          </div>
        </div>
        <div class="comments__replies" id="replies-${comment.id}">
          ${repliesHtml}
        </div>
        ${replyToggle}
        <div class="comments__reply-box" id="replyBox-${comment.id}"></div>
      </div>
    `;
  },

  // ────────────────────── Actions ─────────────────────────────────

  async _submitComment(paperId, chapterIndex, parentId = null) {
    if (!AuthService.requireAuth()) return;

    const inputId = parentId ? `replyInput-${parentId}` : 'commentInput';
    const input = document.getElementById(inputId);
    if (!input) return;

    const content = input.value.trim();
    if (!content) return;
    if (content.length > 5000) {
      alert('Comment must be under 5000 characters.');
      return;
    }

    const btnId = parentId ? `replySubmitBtn-${parentId}` : 'submitCommentBtn';
    const btn = document.getElementById(btnId);
    if (btn) { btn.disabled = true; btn.textContent = 'Posting...'; }

    try {
      const res = await fetch(
        `${AuthService.API_BASE}/api/comments/${paperId}/${chapterIndex}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, parentId })
        }
      );

      if (res.status === 401) {
        AuthService.handleUnauthorized();
        return;
      }
      if (!res.ok) throw new Error('Failed to post comment');

      // Reload comments from page 0 to show the new one
      input.value = '';
      this._currentPage = 0;
      this._loadComments(paperId, chapterIndex, false);
    } catch (e) {
      console.error('Failed to post comment:', e);
      alert('Failed to post comment. Please try again.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Post'; }
    }
  },

  async _deleteComment(commentId, paperId, chapterIndex) {
    if (!AuthService.requireAuth()) return;
    if (!confirm('Delete this comment?')) return;

    try {
      const res = await fetch(
        `${AuthService.API_BASE}/api/comments/${commentId}`,
        { method: 'DELETE', credentials: 'include' }
      );

      if (res.status === 401) {
        AuthService.handleUnauthorized();
        return;
      }
      if (!res.ok) throw new Error('Failed to delete');

      this._currentPage = 0;
      this._loadComments(paperId, chapterIndex, false);
    } catch (e) {
      console.error('Failed to delete comment:', e);
      alert('Failed to delete comment.');
    }
  },

  async _loadReplies(parentId, paperId, chapterIndex, page = 0) {
    const repliesEl = document.getElementById(`replies-${parentId}`);
    if (!repliesEl) return;

    try {
      const res = await fetch(
        `${AuthService.API_BASE}/api/comments/replies/${parentId}?page=${page}&size=5`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Failed to load replies');
      const replies = await res.json();

      const repliesHtml = replies
        .map(r => this._renderComment(r, paperId, chapterIndex, true))
        .join('');

      if (page === 0) {
        repliesEl.innerHTML = repliesHtml;
      } else {
        // Remove existing "Load more replies" button before appending
        const existingBtn = document.getElementById(`loadMoreReplies-${parentId}`);
        if (existingBtn) existingBtn.remove();
        repliesEl.insertAdjacentHTML('beforeend', repliesHtml);
      }

      // Remove the "Show N replies" button (first load)
      const commentEl = repliesEl.closest('.comments__item');
      const showBtn = commentEl ? commentEl.querySelector('.comments__show-replies') : null;
      if (showBtn) showBtn.remove();

      // Add "Load more replies" if we got a full page
      if (replies.length === 5) {
        const nextPage = page + 1;
        repliesEl.insertAdjacentHTML('beforeend', `
          <button class="comments__load-more comments__load-more--replies" id="loadMoreReplies-${parentId}"
                  onclick="CommentSection._loadReplies('${parentId}', '${paperId}', ${chapterIndex}, ${nextPage})">
            Load more replies
          </button>
        `);
      }
    } catch (e) {
      console.error('Failed to load replies:', e);
    }
  },

  _showReplyBox(parentId, paperId, chapterIndex) {
    const container = document.getElementById(`replyBox-${parentId}`);
    if (!container) return;
    if (!AuthService.requireAuth()) return;

    const user = AuthService.getUser();
    container.innerHTML = `
      <div class="comments__compose comments__compose--reply">
        <img class="comments__compose-avatar comments__compose-avatar--small"
             src="${user.avatarUrl || ''}" alt="${user.name}"
             onerror="this.style.display='none';" />
        <div class="comments__compose-input-wrap">
          <textarea class="comments__compose-input" id="replyInput-${parentId}"
                    placeholder="Write a reply..." rows="1"
                    oninput="CommentSection._autoResize(this)"></textarea>
          <div class="comments__compose-actions" style="display:flex;">
            <span></span>
            <div>
              <button class="comments__cancel-btn"
                      onclick="document.getElementById('replyBox-${parentId}').innerHTML=''">Cancel</button>
              <button class="comments__submit-btn" id="replySubmitBtn-${parentId}"
                      onclick="CommentSection._submitComment('${paperId}', ${chapterIndex}, '${parentId}')">
                Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById(`replyInput-${parentId}`).focus();
  },

  // ────────────────────── UI helpers ──────────────────────────────

  _autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';

    // Show/hide actions bar
    const actions = el.closest('.comments__compose-input-wrap')
      ?.querySelector('.comments__compose-actions');
    if (actions) {
      actions.style.display = el.value.trim() ? 'flex' : 'none';
    }

    // Update char count
    const countEl = el.closest('.comments__compose-input-wrap')
      ?.querySelector('.comments__char-count');
    if (countEl) {
      countEl.textContent = `${el.value.length} / 5000`;
    }
  },

  _cancelCompose() {
    const input = document.getElementById('commentInput');
    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }
    const actions = document.getElementById('commentActions');
    if (actions) actions.style.display = 'none';
  },

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    // Convert newlines to <br>
    return div.innerHTML.replace(/\n/g, '<br>');
  },

  _timeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  }
};
