package com.examprep.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.examprep.auth.dto.AuthResponse;
import com.examprep.auth.dto.LoginRequest;
import com.examprep.auth.dto.RegisterRequest;
import com.examprep.config.JwtService;
import com.examprep.user.User;
import com.examprep.user.UserRepository;

class AuthServiceTest {

    private UserRepository userRepository;
    private JwtService jwtService;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        jwtService = mock(JwtService.class);
        when(jwtService.generateToken(anyLong(), anyString())).thenReturn("jwt-token");
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    @Test
    void registerHashesPasswordAndReturnsToken() {
        when(userRepository.existsByEmail("a@b.com")).thenReturn(false);
        when(userRepository.save(any())).thenAnswer(inv -> withId(inv.getArgument(0), 1L));

        AuthResponse response = authService.register(new RegisterRequest("a@b.com", "Ana", "secret123"));

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.email()).isEqualTo("a@b.com");
    }

    @Test
    void registerRejectsDuplicateEmail() {
        when(userRepository.existsByEmail("a@b.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(new RegisterRequest("a@b.com", "Ana", "secret123")))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void loginSucceedsWithCorrectPassword() {
        User user = withId(new User("a@b.com", passwordEncoder.encode("secret123"), "Ana"), 1L);
        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));

        AuthResponse response = authService.login(new LoginRequest("a@b.com", "secret123"));

        assertThat(response.userId()).isEqualTo(1L);
        assertThat(response.token()).isEqualTo("jwt-token");
    }

    @Test
    void loginRejectsWrongPassword() {
        User user = withId(new User("a@b.com", passwordEncoder.encode("secret123"), "Ana"), 1L);
        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest("a@b.com", "wrong")))
            .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void loginRejectsUnknownEmail() {
        when(userRepository.findByEmail("nobody@b.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("nobody@b.com", "secret123")))
            .isInstanceOf(BadCredentialsException.class);
    }

    private static User withId(User user, Long id) {
        try {
            Field field = User.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(user, id);
            return user;
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }
}
