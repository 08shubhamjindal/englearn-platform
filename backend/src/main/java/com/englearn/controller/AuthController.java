package com.englearn.controller;

import com.englearn.dto.UserDTO;
import com.englearn.security.JwtAuthFilter;
import com.englearn.security.JwtUtil;
import com.englearn.service.UserService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
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
    public ResponseEntity<?> getCurrentUser(Authentication authentication,
                                            HttpServletRequest request) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401)
                    .body(Map.of("authenticated", false));
        }

        UUID userId = UUID.fromString(authentication.getPrincipal().toString());

        // Extract token expiry from the JWT cookie (mirrors the exp claim)
        long tokenExpiry = 0;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (JwtAuthFilter.COOKIE_NAME.equals(cookie.getName())) {
                    try {
                        Claims claims = jwtUtil.parseToken(cookie.getValue());
                        tokenExpiry = claims.getExpiration().getTime();
                    } catch (Exception ignored) { }
                    break;
                }
            }
        }

        final long expiry = tokenExpiry;
        return userService.getUserById(userId)
                .map(user -> ResponseEntity.ok(Map.of(
                        "authenticated", true,
                        "user", user,
                        "tokenExpiry", expiry
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
