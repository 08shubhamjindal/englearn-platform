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
     * JOIN FETCH c.user to avoid N+1 on User.
     * Ordered by upvotes DESC, then createdAt DESC.
     */
    @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.paperId = :paperId " +
           "AND c.chapterIndex = :chapterIndex AND c.parentId IS NULL " +
           "ORDER BY c.upvotes DESC, c.createdAt DESC")
    List<Comment> findTopLevelComments(@Param("paperId") String paperId,
                                       @Param("chapterIndex") int chapterIndex,
                                       Pageable pageable);

    /**
     * Get paginated replies to a specific comment, with User eagerly loaded.
     */
    @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.parentId = :parentId " +
           "ORDER BY c.createdAt ASC")
    List<Comment> findRepliesWithUser(@Param("parentId") UUID parentId, Pageable pageable);

    /**
     * Batch count replies for multiple parent comment IDs in one query.
     * Eliminates N+1 on reply counts.
     */
    @Query("SELECT c.parentId, COUNT(c) FROM Comment c WHERE c.parentId IN :parentIds GROUP BY c.parentId")
    List<Object[]> countRepliesByParentIds(@Param("parentIds") List<UUID> parentIds);

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
