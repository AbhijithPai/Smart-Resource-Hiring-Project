package com.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "a-test-secret-key-that-is-at-least-32-characters");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 60_000L);
    }

    @Test
    void generatedTokenContainsEmailAndRoleAndIsValid() {
        String token = jwtUtil.generateToken("admin@example.com", "ADMIN");

        assertTrue(jwtUtil.isTokenValid(token));
        assertEquals("admin@example.com", jwtUtil.extractEmail(token));
        assertEquals("ADMIN", jwtUtil.extractRole(token));
    }

    @Test
    void invalidAndExpiredTokensAreRejected() {
        assertFalse(jwtUtil.isTokenValid("not-a-jwt"));

        ReflectionTestUtils.setField(jwtUtil, "expiration", -1L);
        assertFalse(jwtUtil.isTokenValid(jwtUtil.generateToken("admin@example.com", "ADMIN")));
    }
}
