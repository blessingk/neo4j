import { Injectable } from '@nestjs/common';
import { BrandRepository, SessionRepository } from '../common/neo4j/repositories';
import { IdentifyDto, Provider } from './dto/identify.dto';
import { LoginLinkDto } from './dto/login-link.dto';
import { 
  CustomerSessionDto,
  QuickIdentifyCustomerDto,
  FindCustomerBySessionDto,
  UpdateCustomerSessionDto,
  GetCustomerSessionDto
} from './dto/single-session.dto';
import { 
  BrandInstance, 
  CustomerInstance, 
  SessionInstance,
  CustomerSessionResult,
  CustomerSessionBrandResult,
  CustomerSessionPlainResult,
  CustomerSessionBrandPlainResult,
  CreateOrUpdateCustomerSessionData,
  UpdateCustomerSessionData,
  FindCustomerBySessionData,
  SessionPlainObject,
  CustomerPlainObject,
  BrandPlainObject
} from '../common/neo4j/types';

@Injectable()
export class IdentityService {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  // Helper function to extract data from Neogma objects
  private extractData(obj: any): any {
    if (!obj) return null;
    return (obj as any).dataValues || obj;
  }

  async upsertBrand(id: string, name: string, slug: string): Promise<BrandPlainObject | null> {
    try {
      console.log('Service upsertBrand called with:', { id, name, slug });
      const brand = await this.brandRepository.upsertBrand(id, name, slug);
      console.log('Repository returned:', brand);
      if (!brand) return null;
      
      const brandData = this.extractData(brand);
      const plainBrand = {
        id: brandData.id,
        name: brandData.name,
        slug: brandData.slug,
      };
      console.log('Service returning plain brand:', plainBrand);
      return plainBrand;
    } catch (error) {
      console.error('Brand upsert failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  // Create or update customer's single long-lived session
  async createOrUpdateCustomerSession(dto: CustomerSessionDto): Promise<CustomerSessionPlainResult | null> {
    try {
      const result = await this.sessionRepository.createOrUpdateCustomerSession({
        internalSessionId: dto.internalSessionId,
        email: dto.email || undefined,
        brazeSession: dto.brazeSession || undefined,
        amplitudeSession: dto.amplitudeSession || undefined,
        brandId: dto.brandId || '',
      });

      if (!result) {
        throw new Error('Failed to create or update customer session');
      }

      return {
        customer: result.customer ? this.extractData(result.customer) : null,
        session: result.session ? this.extractData(result.session) : null,
      };
    } catch (error) {
      console.error('Customer session creation failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  // Quick identification by internal session ID
  async quickIdentifyCustomer(dto: QuickIdentifyCustomerDto): Promise<CustomerSessionBrandPlainResult> {
    try {
      const result = await this.sessionRepository.quickIdentifyCustomer(dto.internalSessionId);
      
      return {
        session: result.session ? this.extractData(result.session) : null,
        customer: result.customer ? this.extractData(result.customer) : null,
        brand: result.brand ? this.extractData(result.brand) : null,
      };
    } catch (error) {
      console.error('Quick identify failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  // Find customer by any session identifier
  async findCustomerBySession(dto: FindCustomerBySessionDto): Promise<CustomerSessionBrandPlainResult> {
    try {
      const result = await this.sessionRepository.findCustomerBySession({
        brazeSession: dto.brazeSession || undefined,
        amplitudeSession: dto.amplitudeSession || undefined,
        internalSessionId: dto.internalSessionId || undefined,
        email: dto.email || undefined,
      });

      return {
        session: result.session ? this.extractData(result.session) : null,
        customer: result.customer ? this.extractData(result.customer) : null,
        brand: result.brand ? this.extractData(result.brand) : null,
      };
    } catch (error) {
      console.error('Find customer by session failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  // Update customer's session (when they visit again)
  async updateCustomerSession(dto: UpdateCustomerSessionDto): Promise<SessionInstance | null> {
    try {
      const session = await this.sessionRepository.updateCustomerSession({
        internalSessionId: dto.internalSessionId,
        email: dto.email || undefined,
        brazeSession: dto.brazeSession || undefined,
        amplitudeSession: dto.amplitudeSession || undefined,
        brandId: dto.brandId || '',
      });

      return session || null;
    } catch (error) {
      console.error('Update customer session failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  // Get customer's single session with all details
  async getCustomerSession(dto: GetCustomerSessionDto): Promise<CustomerSessionBrandPlainResult> {
    try {
      const result = await this.sessionRepository.quickIdentifyCustomer(dto.internalSessionId);
      
      return {
        customer: result.customer || null,
        session: result.session || null,
        brand: result.brand || null,
      };
    } catch (error) {
      console.error('Get customer session failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  // Get all customers with their sessions (for admin/debugging)
  async getAllCustomersWithSessions(): Promise<any[]> {
    try {
      // This would need to be implemented in the repository
      // For now, return empty array as this is likely not used in production
      console.warn('getAllCustomersWithSessions not implemented with OGM yet');
      return [];
    } catch (error) {
      console.error('Get all customers failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  // Get customer loyalty profile (simplified)
  async getCustomerLoyaltyProfile(dto: GetCustomerSessionDto): Promise<CustomerSessionBrandResult> {
    try {
      const result = await this.sessionRepository.quickIdentifyCustomer(dto.internalSessionId);
      
      return {
        customer: result.customer || null,
        session: result.session || null,
        brand: result.brand || null,
      };
    } catch (error) {
      console.error('Get customer loyalty profile failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  // Find customer by email (for email changes)
  async findCustomerByEmail(email: string): Promise<CustomerSessionBrandResult> {
    try {
      const result = await this.sessionRepository.findCustomerBySession({ email });
      
      return {
        session: result.session || null,
        customer: result.customer || null,
        brand: result.brand || null,
      };
    } catch (error) {
      console.error('Find customer by email failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  // Legacy method for backward compatibility
  async identify(dto: IdentifyDto): Promise<{ internalSessionId: string; customer: CustomerPlainObject | null; session: SessionPlainObject | null }> {
    try {
      const internalSessionId = this.generateInternalSessionId(dto);
      
      const result = await this.createOrUpdateCustomerSession({
        internalSessionId,
        brazeSession: dto.provider === Provider.BRAZE ? dto.externalSessionId : undefined,
        amplitudeSession: dto.provider === Provider.AMPLITUDE ? dto.externalSessionId : undefined,
        brandId: dto.brandId,
      });

      return {
        internalSessionId,
        customer: result.customer,
        session: result.session,
      };
    } catch (error) {
      console.error('Identify failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  // Legacy method for backward compatibility
  async linkOnLogin(dto: LoginLinkDto): Promise<{ internalSessionId: string; customer: CustomerPlainObject | null; session: SessionPlainObject | null }> {
    try {
      const internalSessionId = this.generateInternalSessionId(dto);
      
      const result = await this.createOrUpdateCustomerSession({
        internalSessionId,
        email: dto.email,
        brazeSession: dto.provider === Provider.BRAZE ? dto.externalSessionId : undefined,
        amplitudeSession: dto.provider === Provider.AMPLITUDE ? dto.externalSessionId : undefined,
        brandId: dto.brandId,
      });

      return {
        internalSessionId,
        customer: result.customer,
        session: result.session,
      };
    } catch (error) {
      console.error('Link login failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  // Resolve customer for session
  async getCustomerForSession(provider: Provider, externalSessionId: string) {
    try {
      const result = await this.findCustomerBySession({
        brazeSession: provider === Provider.BRAZE ? externalSessionId : undefined,
        amplitudeSession: provider === Provider.AMPLITUDE ? externalSessionId : undefined,
      });

      return {
        customer: result.customer,
        session: result.session,
        brand: result.brand,
      };
    } catch (error) {
      console.error('Get customer for session failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  private generateInternalSessionId(dto: IdentifyDto | LoginLinkDto): string {
    // Generate a consistent internal session ID based on external session ID and brand
    return `${dto.provider}_${dto.externalSessionId}_${dto.brandId}`;
  }
}