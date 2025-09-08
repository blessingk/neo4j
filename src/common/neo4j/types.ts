// TypeScript interfaces for OGM models

export interface BrandProperties {
  id: string;
  name: string;
  slug: string;
}

export interface BrandInstance {
  id: string;
  name: string;
  slug: string;
  save(): Promise<BrandInstance>;
}

export interface CustomerProperties {
  id: string;
  internalSessionId: string;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
}

export interface CustomerInstance {
  id: string;
  internalSessionId: string;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
  save(): Promise<CustomerInstance>;
}

export interface SessionProperties {
  id: string;
  internalSessionId: string;
  brazeSession?: string | null;
  amplitudeSession?: string | null;
  email?: string | null;
  brandId: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface SessionInstance {
  id: string;
  internalSessionId: string;
  brazeSession?: string | null;
  amplitudeSession?: string | null;
  email?: string | null;
  brandId: string;
  createdAt: string;
  lastSeenAt: string;
  save(): Promise<SessionInstance>;
}

export interface IdentityProperties {
  id: string;
  provider: string;
  externalId: string;
  createdAt: string;
}

export interface IdentityInstance {
  id: string;
  provider: string;
  externalId: string;
  createdAt: string;
  save(): Promise<IdentityInstance>;
}

// Plain object types for API responses
export interface BrandPlainObject {
  id: string;
  name: string;
  slug: string;
}

export interface CustomerPlainObject {
  id: string;
  internalSessionId: string;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
}

export interface SessionPlainObject {
  id: string;
  internalSessionId: string;
  brazeSession?: string | null;
  amplitudeSession?: string | null;
  email?: string | null;
  brandId: string;
  createdAt: string;
  lastSeenAt: string;
}

// Repository return types
export interface CustomerSessionResult {
  customer: CustomerInstance | null;
  session: SessionInstance | null;
}

export interface CustomerSessionBrandResult {
  customer: CustomerInstance | null;
  session: SessionInstance | null;
  brand: BrandInstance | null;
}

// Service return types (plain objects)
export interface CustomerSessionPlainResult {
  customer: CustomerPlainObject | null;
  session: SessionPlainObject | null;
}

export interface CustomerSessionBrandPlainResult {
  customer: CustomerPlainObject | null;
  session: SessionPlainObject | null;
  brand: BrandPlainObject | null;
}

// Service method parameter types
export interface CreateOrUpdateCustomerSessionData {
  internalSessionId: string;
  email?: string;
  brazeSession?: string;
  amplitudeSession?: string;
  brandId: string;
}

export interface UpdateCustomerSessionData {
  internalSessionId: string;
  email?: string;
  brazeSession?: string;
  amplitudeSession?: string;
  brandId: string;
}

export interface FindCustomerBySessionData {
  brazeSession?: string;
  amplitudeSession?: string;
  internalSessionId?: string;
  email?: string;
}
