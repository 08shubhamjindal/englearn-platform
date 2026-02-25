package com.englearn.repository;

import com.englearn.entity.Comment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

    /**
     * Get top-level comments for a paper chapter.
     * Ordered by upvotes DESC, then createdAt DESC (most upvoted first, ties broken by newest).
     * Supports pagination via Pageable.
     */
    @Query("SELECT c FROM Comment c WHERE c.paperId = :paperId " +
           "AND c.chapterIndex = :chapterIndex AND c.parentId IS NULL " +
           "ORDER BY c.upvotes DESC, c.createdAt DESC")
    List<Comment> findTopLevelComments(@Param("paperId") String paperId,
                                       @Param("chapterIndex") int chapterIndex,
                                       Pageable pageable);

    /**
     * Get all replies to a specific comment, ordered oldest first.
     */
    List<Comment> findByParentIdOrderByCreatedAtAsc(UUID parentId);

    /**
     * Count comments for a paper chapter (top-level only).
     */
    long countByPaperIdAndChapterIndexAndParentIdIsNull(String paperId, int chapterIndex);

    /**
     * Count replies to a specific comment.
     */
    long countByParentId(UUID parentId);

    /**
     * Get all comments by a user.
     */
    List<Comment> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
