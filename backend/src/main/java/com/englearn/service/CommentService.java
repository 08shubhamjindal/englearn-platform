package com.englearn.service;

import com.englearn.dto.CommentResponseDTO;
import com.englearn.dto.CommentRequestDTO;
import com.englearn.entity.Comment;
import com.englearn.entity.User;
import com.englearn.repository.CommentRepository;
import com.englearn.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private static final int DEFAULT_PAGE_SIZE = 5;

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    /**
     * Get top-level comments for a paper chapter, with replies nested.
     * Sorted by upvotes DESC, then createdAt DESC. Paginated (default 5).
     * @param viewerUserId the requesting user's ID (null if unauthenticated)
     */
    @Transactional(readOnly = true)
    public List<CommentResponseDTO> getCommentsForChapter(String paperId, int chapterIndex,
                                                           int page, int size, UUID viewerUserId) {
        // Query 1: Fetch comments + users in ONE query (JOIN FETCH)
        List<Comment> topLevel = commentRepository
                .findTopLevelComments(paperId, chapterIndex, PageRequest.of(page, size));

        if (topLevel.isEmpty()) return List.of();

        // Query 2: Batch fetch reply counts in ONE query
        List<UUID> commentIds = topLevel.stream().map(Comment::getId).collect(Collectors.toList());
        Map<UUID, Long> replyCounts = getReplyCountsBatch(commentIds);

        return topLevel.stream()
                .map(c -> toDTO(c, viewerUserId, replyCounts.getOrDefault(c.getId(), 0L)))
                .collect(Collectors.toList());
    }

    /**
     * Get paginated replies for a specific comment.
     * @param viewerUserId the requesting user's ID (null if unauthenticated)
     */
    @Transactional(readOnly = true)
    public List<CommentResponseDTO> getReplies(UUID parentId, int page, int size, UUID viewerUserId) {
        // Query 1: Fetch replies + users in ONE query (JOIN FETCH)
        List<Comment> replies = commentRepository
                .findRepliesWithUser(parentId, PageRequest.of(page, size));

        if (replies.isEmpty()) return List.of();

        // Query 2: Batch fetch reply counts (for nested reply counts)
        List<UUID> replyIds = replies.stream().map(Comment::getId).collect(Collectors.toList());
        Map<UUID, Long> replyCounts = getReplyCountsBatch(replyIds);

        return replies.stream()
                .map(c -> toDTO(c, viewerUserId, replyCounts.getOrDefault(c.getId(), 0L)))
                .collect(Collectors.toList());
    }

    /**
     * Create a new comment (top-level or reply).
     */
    @Transactional
    public CommentResponseDTO createComment(String paperId, int chapterIndex,
                                             CommentRequestDTO request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // If this is a reply, verify the parent comment exists
        if (request.getParentId() != null) {
            commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));
        }

        Comment comment = Comment.builder()
                .user(user)
                .paperId(paperId)
                .chapterIndex(chapterIndex)
                .parentId(request.getParentId())
                .content(request.getContent().trim())
                .build();

        Comment saved = commentRepository.save(comment);
        // The creator can always delete their own comment — replyCount is 0 for new comments
        return toDTO(saved, userId, 0);
    }

    /**
     * Delete a comment. Only the author or an admin can delete.
     */
    @Transactional
    public boolean deleteComment(UUID commentId, UUID userId) {
        Optional<Comment> opt = commentRepository.findById(commentId);
        if (opt.isEmpty()) return false;

        Comment comment = opt.get();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Only author or admin can delete
        if (!comment.getUser().getId().equals(userId) && !"ADMIN".equals(user.getRole())) {
            return false;
        }

        // Soft delete — mark as deleted, clear content. Replies remain intact.
        comment.setDeleted(true);
        comment.setContent("");
        commentRepository.save(comment);
        return true;
    }

    /**
     * Get comment count for a paper chapter.
     */
    @Transactional(readOnly = true)
    public long getCommentCount(String paperId, int chapterIndex) {
        return commentRepository.countByPaperIdAndChapterIndexAndParentIdIsNullAndDeletedFalse(paperId, chapterIndex);
    }

    // ────────────────────── Mapping helpers ──────────────────────

    /**
     * Batch fetch reply counts for multiple comment IDs in one query.
     */
    private Map<UUID, Long> getReplyCountsBatch(List<UUID> parentIds) {
        if (parentIds.isEmpty()) return Map.of();
        return commentRepository.countRepliesByParentIds(parentIds).stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]
                ));
    }

    /**
     * Compute whether the viewer can delete this comment.
     * Only checks author match — admin permission is enforced on the actual DELETE endpoint.
     */
    private boolean canDelete(Comment comment, UUID viewerUserId) {
        if (viewerUserId == null) return false;
        return comment.getUser().getId().equals(viewerUserId);
    }

    /**
     * Map Comment to DTO — no extra queries.
     * User is already loaded (JOIN FETCH), replyCount is pre-computed (batch).
     */
    private CommentResponseDTO toDTO(Comment comment, UUID viewerUserId, long replyCount) {
        boolean isDeleted = comment.isDeleted();
        return CommentResponseDTO.builder()
                .id(comment.getId())
                .content(isDeleted ? "[deleted]" : comment.getContent())
                .upvotes(comment.getUpvotes())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .authorName(isDeleted ? "[deleted]" : comment.getUser().getName())
                .authorAvatarUrl(isDeleted ? null : comment.getUser().getAvatarUrl())
                .canDelete(!isDeleted && canDelete(comment, viewerUserId))
                .deleted(isDeleted)
                .parentId(comment.getParentId())
                .replies(null)
                .replyCount(replyCount)
                .build();
    }
}
