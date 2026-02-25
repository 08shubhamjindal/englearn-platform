package com.englearn.controller;

import com.englearn.dto.CommentRequestDTO;
import com.englearn.dto.CommentResponseDTO;
import com.englearn.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /**
     * GET /api/comments/{paperId}/{chapterIndex}?page=0&size=5
     * Public — returns top-level comments sorted by upvotes, then time.
     */
    @GetMapping("/{paperId}/{chapterIndex}")
    public ResponseEntity<List<CommentResponseDTO>> getComments(
            @PathVariable String paperId,
            @PathVariable int chapterIndex,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            Authentication authentication) {
        UUID viewerUserId = extractUserId(authentication);
        return ResponseEntity.ok(
                commentService.getCommentsForChapter(paperId, chapterIndex, page, size, viewerUserId));
    }

    /**
     * GET /api/comments/{paperId}/{chapterIndex}/count
     * Public — returns comment count for the chapter.
     */
    @GetMapping("/{paperId}/{chapterIndex}/count")
    public ResponseEntity<Map<String, Long>> getCommentCount(
            @PathVariable String paperId,
            @PathVariable int chapterIndex) {
        long count = commentService.getCommentCount(paperId, chapterIndex);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * GET /api/comments/replies/{commentId}
     * Public — returns replies for a specific comment.
     */
    @GetMapping("/replies/{commentId}")
    public ResponseEntity<List<CommentResponseDTO>> getReplies(
            @PathVariable UUID commentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            Authentication authentication) {
        UUID viewerUserId = extractUserId(authentication);
        return ResponseEntity.ok(commentService.getReplies(commentId, page, size, viewerUserId));
    }

    /**
     * POST /api/comments/{paperId}/{chapterIndex}
     * Authenticated — create a new comment or reply.
     */
    @PostMapping("/{paperId}/{chapterIndex}")
    public ResponseEntity<CommentResponseDTO> createComment(
            @PathVariable String paperId,
            @PathVariable int chapterIndex,
            @Valid @RequestBody CommentRequestDTO request,
            Authentication authentication) {

        UUID userId = UUID.fromString(authentication.getPrincipal().toString());
        CommentResponseDTO created = commentService.createComment(
                paperId, chapterIndex, request, userId);

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * DELETE /api/comments/{commentId}
     * Authenticated — delete own comment (or admin can delete any).
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable UUID commentId,
            Authentication authentication) {

        UUID userId = UUID.fromString(authentication.getPrincipal().toString());
        boolean deleted = commentService.deleteComment(commentId, userId);

        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Comment deleted"));
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Cannot delete this comment"));
    }

    /**
     * Extract userId from Authentication, or null if unauthenticated.
     */
    private UUID extractUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return null;
        try {
            return UUID.fromString(authentication.getPrincipal().toString());
        } catch (Exception e) {
            return null;
        }
    }
}
