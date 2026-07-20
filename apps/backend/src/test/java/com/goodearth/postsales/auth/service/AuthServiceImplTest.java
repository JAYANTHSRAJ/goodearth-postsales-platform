package com.goodearth.postsales.auth.service;

import com.goodearth.postsales.auth.dto.LoginRequest;
import com.goodearth.postsales.auth.dto.LoginResponse;
import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.entity.RefreshToken;
import com.goodearth.postsales.common.enumeration.UserRole;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private RefreshTokenService refreshTokenService;

    private AuthServiceImpl authService;

    private void initAuthService(boolean testMode, String testMasterPassword) {
        authService = new AuthServiceImpl(
                userRepository,
                passwordEncoder,
                jwtTokenProvider,
                refreshTokenService,
                86400000L,
                5,
                testMode,
                testMasterPassword
        );
    }

    @Test
    public void testAuthenticateCredentials_ExistingUser_TestMasterPassword_Success() {
        initAuthService(true, "GoodEarth@123");

        LoginRequest request = new LoginRequest();
        request.setEmail("user@goodearth.com");
        request.setPassword("GoodEarth@123");
        request.setDeviceName("Desktop");

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@goodearth.com");
        user.setPassword("hashed_password");
        user.setAccountLocked(false);
        user.setAccountActivated(true);
        user.setRole(UserRole.CLIENT);

        when(userRepository.findByEmailIgnoreCase("user@goodearth.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtTokenProvider.generateAccessToken(anyString(), anyString(), anyString())).thenReturn("mock_access_token");
        
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken("mock_refresh_token");
        when(refreshTokenService.createRefreshToken(any(User.class), any(), any(), any())).thenReturn(refreshToken);

        LoginResponse response = authService.authenticateCredentials(request, "127.0.0.1", "Mozilla");

        assertNotNull(response);
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    public void testAuthenticateCredentials_ExistingUser_WrongPassword_NormalAuth() {
        initAuthService(true, "GoodEarth@123");

        LoginRequest request = new LoginRequest();
        request.setEmail("user@goodearth.com");
        request.setPassword("wrong_password");
        request.setDeviceName("Desktop");

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@goodearth.com");
        user.setPassword("hashed_password");
        user.setAccountLocked(false);
        user.setAccountActivated(true);
        user.setFailedLoginAttempts(0);

        when(userRepository.findByEmailIgnoreCase("user@goodearth.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong_password", "hashed_password")).thenReturn(false);

        CustomException exception = assertThrows(CustomException.class, () -> {
            authService.authenticateCredentials(request, "127.0.0.1", "Mozilla");
        });

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals("Invalid credentials", exception.getMessage());
        verify(passwordEncoder).matches("wrong_password", "hashed_password");
    }

    @Test
    public void testAuthenticateCredentials_NonExistingUser_TestMasterPassword_Failure() {
        initAuthService(true, "GoodEarth@123");

        LoginRequest request = new LoginRequest();
        request.setEmail("unknown@goodearth.com");
        request.setPassword("GoodEarth@123");

        when(userRepository.findByEmailIgnoreCase("unknown@goodearth.com")).thenReturn(Optional.empty());

        CustomException exception = assertThrows(CustomException.class, () -> {
            authService.authenticateCredentials(request, "127.0.0.1", "Mozilla");
        });

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals("Invalid credentials", exception.getMessage());
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    public void testAuthenticateCredentials_TestModeFalse_NormalAuthOnly_WrongPassword() {
        initAuthService(false, "GoodEarth@123");

        LoginRequest request = new LoginRequest();
        request.setEmail("user@goodearth.com");
        request.setPassword("GoodEarth@123");

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@goodearth.com");
        user.setPassword("hashed_password");
        user.setAccountLocked(false);
        user.setAccountActivated(true);
        user.setFailedLoginAttempts(0);

        when(userRepository.findByEmailIgnoreCase("user@goodearth.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("GoodEarth@123", "hashed_password")).thenReturn(false);

        CustomException exception = assertThrows(CustomException.class, () -> {
            authService.authenticateCredentials(request, "127.0.0.1", "Mozilla");
        });

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals("Invalid credentials", exception.getMessage());
        verify(passwordEncoder).matches("GoodEarth@123", "hashed_password");
    }
}
