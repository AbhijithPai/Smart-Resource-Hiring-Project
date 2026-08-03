package com.srh_backend;

import com.SrhBackendApplication;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class SrhBackendApplicationTests {

	@Test
	void applicationClassIsPresent() {
		SrhBackendApplication application = new SrhBackendApplication();

		assertNotNull(application);
	}

}
