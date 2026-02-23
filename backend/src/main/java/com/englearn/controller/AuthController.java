package com.englearn.controller;

import com.englearn.dto.UserDTO;
import com.englearn.security.JwtAuthFilter;
import com.englearn.security.JwtUtil;
import com.englearn.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    /**
     * GET /api/auth/me
     * Returns the current logged-in user, or 401 if not authenticated.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401)
                    .body(Map.of("authenticated", false));
        }

        UUID userId = UUID.fromString(authentication.getPrincipal().toString());
        return userService.getUserById(userId)
                .map(user -> ResponseEntity.ok(Map.of(
                        "authenticated", true,
                        "user", user
                )))
                .orElse(ResponseEntity.status(401)
                        .body(Map.of("authenticated", false)));
    }

    /**
     * POST /api/auth/logout
     * Clears the JWT cookie.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie(JwtAuthFilter.COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Set true in production
        cookie.setPath("/");
        cookie.setMaxAge(0); // Delete the cookie
        response.addCookie(cookie);

        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
