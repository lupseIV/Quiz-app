package com.examprep.config;

/** Authenticated principal placed in the SecurityContext by {@link JwtAuthFilter}. */
public record AuthUser(Long id, String email) {
}
