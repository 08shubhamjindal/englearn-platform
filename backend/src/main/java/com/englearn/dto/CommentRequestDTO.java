package com.englearn.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

/**
 * Request body for creating a new comment.
 */
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class CommentRequestDTO {

    @NotBlank(message = "Comment content is required")
    @Size(min = 1, max = 5000, message = "Comment must be between 1 and 5000 characters")
    private String content;

    /**
     * Optional — if set, this comment is a reply to the given parent comment.
     */
    private UUID parentId;
}
