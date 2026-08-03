package com.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Smart Resource Hiring API",
                version = "1.0.0",
                description = "Authentication and employee-management APIs for Smart Resource Hiring.",
                contact = @Contact(name = "SRH API Team")
        )
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Paste the JWT token from /api/auth/login. In Swagger UI, paste the raw token only; do not type Bearer again."
)
public class OpenApiConfig {
}
