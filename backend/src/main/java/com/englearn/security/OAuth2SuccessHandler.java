package com.englearn.security;

import com.englearn.entity.User;
import com.englearn.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

/**
 * After Google OAuth2 login succeeds, this handler:
 * 1. Creates or updates the user in the database
 * 2. Issues a JWT in an HttpOnly cookie
 * 3. Redirects to the frontend
 */
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${app.jwt.cookie-max-age-seconds}")
    private int cookieMaxAge;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String googleId = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        // Create or update user
        User user = userRepository.findByGoogleId(googleId)
                .map(existing -> {
                    existing.setName(name);
                    existing.setEmail(email);
                    existing.setAvatarUrl(picture);
                    existing.setLastLoginAt(Instant.now());
                    return userRepository.save(existing);
                })
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .googleId(googleId)
                                .email(email)
                                .name(name)
                                .avatarUrl(picture)
                                .role("USER")
                                .build()
                ));

        // Generate JWT
        String token = jwtUtil.generateToken(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getAvatarUrl(),
                user.getRole()
        );

        // Set HttpOnly cookie
        Cookie cookie = new Cookie(JwtAuthFilter.COOKIE_NAME, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Set true in production (HTTPS)
        cookie.setPath("/");
        cookie.setMaxAge(cookieMaxAge);
        response.addCookie(cookie);

        // Redirect to frontend with login callback flag
        response.sendRedirect(frontendUrl + "?auth=success");
    }
}
