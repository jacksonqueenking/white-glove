/**
 * Vitest Test Setup
 *
 * This file runs before all tests to set up the test environment.
 */

import { beforeAll, afterAll, afterEach } from 'vitest';

// Set up test environment variables
beforeAll(() => {
  // Note: NODE_ENV is already set to 'test' by vitest
  // Add any global test setup here
  // For example, setting up test database connections, etc.
});

// Clean up after each test
afterEach(() => {
  // Reset mocks between tests
  // For example: vi.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  // Add any global test cleanup here
});
