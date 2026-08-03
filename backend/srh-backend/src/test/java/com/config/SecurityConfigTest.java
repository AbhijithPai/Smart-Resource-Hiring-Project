package com.config;

import com.filter.JwtAuthFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class SecurityConfigTest {

    private final SecurityConfig securityConfig = new SecurityConfig(mock(JwtAuthFilter.class));

    @Test
    void passwordEncoderUsesBcrypt() {
        assertInstanceOf(BCryptPasswordEncoder.class, securityConfig.passwordEncoder());
        assertTrue(securityConfig.passwordEncoder().matches(
                "secret",
                securityConfig.passwordEncoder().encode("secret")
        ));
    }

    @Test
    void corsAllowsTheFrontendAndSupportedMethods() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/employees");
        CorsConfiguration cors = securityConfig.corsConfigurationSource().getCorsConfiguration(request);

        assertNotNull(cors);
        assertEquals("http://localhost:5173", cors.getAllowedOrigins().get(0));
        assertTrue(cors.getAllowedMethods().containsAll(
                java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")
        ));
        assertEquals(Boolean.TRUE, cors.getAllowCredentials());
    }
}
