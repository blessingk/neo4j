// Centralized mock data for testing
import { BrandInstance, CustomerInstance, SessionInstance, CustomerSessionResult, CustomerSessionBrandResult } from '../neo4j/types';

// Mock Brand data
export const mockBrandData: BrandInstance = {
  id: 'brand-1',
  name: 'Test Brand',
  slug: 'test-brand',
  save: jest.fn(),
} as any;

// Mock Customer data
export const mockCustomerData: CustomerInstance = {
  id: 'customer-1',
  internalSessionId: 'session-123',
  email: 'test@example.com',
  createdAt: '2023-01-01T00:00:00.000Z',
  save: jest.fn(),
} as any;

// Mock Session data
export const mockSessionData: SessionInstance = {
  id: 'session-1',
  internalSessionId: 'session-123',
  brazeSession: 'braze-123',
  amplitudeSession: 'amp-123',
  email: 'test@example.com',
  brandId: 'brand-1',
  createdAt: '2023-01-01T00:00:00.000Z',
  lastSeenAt: '2023-01-01T00:00:00.000Z',
  save: jest.fn(),
} as any;

// Mock result objects
export const mockCustomerSessionResult: CustomerSessionResult = {
  customer: mockCustomerData,
  session: mockSessionData,
};

export const mockCustomerSessionBrandResult: CustomerSessionBrandResult = {
  customer: mockCustomerData,
  session: mockSessionData,
  brand: mockBrandData,
};

// Mock repository objects
export const mockBrandRepository = {
  upsertBrand: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
};

export const mockSessionRepository = {
  createOrUpdateCustomerSession: jest.fn(),
  quickIdentifyCustomer: jest.fn(),
  findCustomerBySession: jest.fn(),
  updateCustomerSession: jest.fn(),
  getCustomerSession: jest.fn(),
  getCustomerLoyaltyProfile: jest.fn(),
  findCustomerByEmail: jest.fn(),
};

// Helper functions for generating test data
export const generateTestId = (prefix: string = 'test') => `${prefix}-${Date.now()}`;

export const generateTestBrand = (id: string = generateTestId('brand')) => ({
  id,
  name: `Test Brand ${id}`,
  slug: `test-brand-${id}`,
  save: jest.fn(),
} as any);

export const generateTestCustomer = (id: string = generateTestId('customer'), email: string = `customer-${id}@example.com`) => ({
  id,
  internalSessionId: generateTestId('session'),
  email,
  createdAt: new Date().toISOString(),
  save: jest.fn(),
} as any);

export const generateTestSession = (id: string = generateTestId('session'), brandId: string = generateTestId('brand')) => ({
  id,
  internalSessionId: generateTestId('session'),
  brazeSession: generateTestId('braze'),
  amplitudeSession: generateTestId('amp'),
  email: `customer-${id}@example.com`,
  brandId,
  createdAt: new Date().toISOString(),
  lastSeenAt: new Date().toISOString(),
  save: jest.fn(),
} as any);

// Test constants
export const TEST_CONSTANTS = {
  BRAND_ID: 'test-brand-1',
  CUSTOMER_ID: 'test-customer-1',
  SESSION_ID: 'test-session-1',
  EMAIL_1: 'customer1@example.com',
  EMAIL_2: 'customer2@example.com',
} as const;