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
        List<Comment> topLevel = commentRepository
                .findTopLevelComments(paperId, chapterIndex, PageRequest.of(page, size));

        return topLevel.stream()
                .map(c -> toDTO(c, viewerUserId))
                .collect(Collectors.toList());
    }

    /**
     * Get replies for a specific comment.
     * @param viewerUserId the requesting user's ID (null if unauthenticated)
     */
    @Transactional(readOnly = true)
    public List<CommentResponseDTO> getReplies(UUID parentId, UUID viewerUserId) {
        return commentRepository.findByParentIdOrderByCreatedAtAsc(parentId)
                .stream()
                .map(c -> toDTOWithoutReplies(c, viewerUserId))
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
        // The creator can always delete their own comment
        return toDTOWithoutReplies(saved, userId);
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

        commentRepository.delete(comment);
        return true;
    }

    /**
     * Get comment count for a paper chapter.
     */
    @Transactional(readOnly = true)
    public long getCommentCount(String paperId, int chapterIndex) {
        return commentRepository.countByPaperIdAndChapterIndexAndParentIdIsNull(paperId, chapterIndex);
    }

    // ────────────────────── Mapping helpers ──────────────────────

    /**
     * Compute whether the viewer can delete this comment.
     * Author or ADMIN can delete.
     */
    private boolean canDelete(Comment comment, UUID viewerUserId) {
        if (viewerUserId == null) return false;
        if (comment.getUser().getId().equals(viewerUserId)) return true;
        return userRepository.findById(viewerUserId)
                .map(u -> "ADMIN".equals(u.getRole()))
                .orElse(false);
    }

    private CommentResponseDTO toDTO(Comment comment, UUID viewerUserId) {
        List<Comment> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(comment.getId());

        return CommentResponseDTO.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .upvotes(comment.getUpvotes())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .authorName(comment.getUser().getName())
                .authorAvatarUrl(comment.getUser().getAvatarUrl())
                .canDelete(canDelete(comment, viewerUserId))
                .parentId(comment.getParentId())
                .replies(replies.stream().map(c -> toDTOWithoutReplies(c, viewerUserId)).collect(Collectors.toList()))
                .replyCount(replies.size())
                .build();
    }

    private CommentResponseDTO toDTOWithoutReplies(Comment comment, UUID viewerUserId) {
        long replyCount = commentRepository.countByParentId(comment.getId());

        return CommentResponseDTO.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .upvotes(comment.getUpvotes())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .authorName(comment.getUser().getName())
                .authorAvatarUrl(comment.getUser().getAvatarUrl())
                .canDelete(canDelete(comment, viewerUserId))
                .parentId(comment.getParentId())
                .replies(null)
                .replyCount(replyCount)
                .build();
    }
}
