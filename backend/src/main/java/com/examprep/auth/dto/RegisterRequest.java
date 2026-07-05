package com.examprep.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank @Email String email,
    @NotBlank String name,
    @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password) {
}
