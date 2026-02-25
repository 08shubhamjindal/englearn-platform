package com.englearn.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO returned to the frontend for a comment.
 * Includes author info and nested replies.
 */
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CommentResponseDTO {
    private UUID id;
    private String content;
    private int upvotes;
    private Instant createdAt;
    private Instant updatedAt;

    // Author display info (no IDs or emails exposed)
    private String authorName;
    private String authorAvatarUrl;

    // Permissions (computed server-side based on the requesting user)
    private boolean canDelete;

    // Threading
    private UUID parentId;
    private List<CommentResponseDTO> replies;
    private long replyCount;
}
