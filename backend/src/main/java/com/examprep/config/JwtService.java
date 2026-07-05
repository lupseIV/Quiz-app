package com.examprep.config;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey key;
    private final Duration expiration;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-minutes}") long expirationMinutes) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException(
                "JWT_SECRET must be set and at least 32 characters long");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expiration = Duration.ofMinutes(expirationMinutes);
    }

    public String generateToken(Long userId, String email) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(email)
            .claim("uid", userId)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(expiration)))
            .signWith(key)
            .compact();
    }

    /** Returns the parsed claims, or throws JwtException if invalid/expired. */
    public Claims parse(String token) {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
