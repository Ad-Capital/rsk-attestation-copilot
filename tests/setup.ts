import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Mock console methods for cleaner test output
const originalConsole = { ...console };

beforeEach(() => {
  // Restore console for each test
  Object.assign(console, originalConsole);
});

// Global test timeout
jest.setTimeout(30000);