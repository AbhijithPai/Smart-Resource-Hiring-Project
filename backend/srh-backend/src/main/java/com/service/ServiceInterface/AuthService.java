package com.service.ServiceInterface;

import com.dto.request.LoginRequest;
import com.dto.response.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);

}
