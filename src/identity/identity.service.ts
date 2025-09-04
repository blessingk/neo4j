import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../common/neo4j/neo4j.service';
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
  UPSERT_BRAND, 
  UPSERT_CUSTOMER_SESSION,
  QUICK_IDENTIFY_CUSTOMER,
  FIND_CUSTOMER_BY_SESSION,
  UPDATE_CUSTOMER_SESSION,
  GET_CUSTOMER_SESSION,
  GET_ALL_CUSTOMERS_WITH_SESSIONS,
  GET_CUSTOMER_LOYALTY_PROFILE,
  FIND_CUSTOMER_BY_EMAIL
} from './queries.cypher';

@Injectable()
export class IdentityService {
  constructor(private readonly neo: Neo4jService) {}

  async upsertBrand(id: string, name: string, slug: string) {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(UPSERT_BRAND, { brandId: id, name, slug });
      return res.records[0]?.get('b').properties;
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Create or update customer's single long-lived session
  async createOrUpdateCustomerSession(dto: CustomerSessionDto) {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(UPSERT_CUSTOMER_SESSION, {
        internalSessionId: dto.internalSessionId,
        email: dto.email || null,
        brazeSession: dto.brazeSession || null,
        amplitudeSession: dto.amplitudeSession || null,
        brandId: dto.brandId || null,
      });
      
      const record = res.records[0];
      const customer = record.get('c').properties;
      const sessionData = record.get('s').properties;
      
      return {
        customer,
        session: sessionData
      };
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Quick identification by internal session ID
  async quickIdentifyCustomer(dto: QuickIdentifyCustomerDto) {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(QUICK_IDENTIFY_CUSTOMER, {
        internalSessionId: dto.internalSessionId,
      });
      
      if (res.records.length === 0) {
        return { session: null, customer: null };
      }
      
      const record = res.records[0];
      const sessionData = record.get('s')?.properties;
      const customerData = record.get('c')?.properties;
      const brandData = record.get('b')?.properties;
      
      return {
        session: sessionData,
        customer: customerData && Object.keys(customerData).length > 0 ? customerData : null,
        brand: brandData
      };
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Find customer by any session identifier
  async findCustomerBySession(dto: FindCustomerBySessionDto) {
    let session;
    try {
      session = this.neo.session();
      
      let res;
      
      if (dto.internalSessionId) {
        // Look up by internal session ID (primary identifier)
        res = await session.run(QUICK_IDENTIFY_CUSTOMER, {
          internalSessionId: dto.internalSessionId,
        });
      } else if (dto.brazeSession) {
        // Look up by Braze session identifier
        res = await session.run(FIND_CUSTOMER_BY_SESSION, {
          brazeSession: dto.brazeSession,
          amplitudeSession: null,
          internalSessionId: null,
          email: null,
        });
      } else if (dto.amplitudeSession) {
        // Look up by Amplitude session identifier
        res = await session.run(FIND_CUSTOMER_BY_SESSION, {
          brazeSession: null,
          amplitudeSession: dto.amplitudeSession,
          internalSessionId: null,
          email: null,
        });
      } else if (dto.email) {
        // Look up by email (fallback for email changes)
        res = await session.run(FIND_CUSTOMER_BY_EMAIL, {
          email: dto.email,
        });
      } else {
        throw new Error('Either internalSessionId, brazeSession, amplitudeSession, or email must be provided');
      }
      
      if (res.records.length === 0) {
        return null;
      }
      
      const record = res.records[0];
      const sessionData = record.get('s')?.properties;
      const customerData = record.get('c')?.properties;
      const brandData = record.get('b')?.properties;
      
      // Return null if no customer data found
      if (!customerData || Object.keys(customerData).length === 0) {
        return null;
      }
      
      return {
        session: sessionData,
        customer: customerData,
        brand: brandData
      };
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Update customer's session (when they visit again)
  async updateCustomerSession(dto: UpdateCustomerSessionDto) {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(UPDATE_CUSTOMER_SESSION, {
        internalSessionId: dto.internalSessionId,
        email: dto.email || null,
        brazeSession: dto.brazeSession || null,
        amplitudeSession: dto.amplitudeSession || null,
        brandId: dto.brandId || null,
      });
      
      if (res.records.length === 0) {
        // If no session exists, create one
        return this.createOrUpdateCustomerSession({
          internalSessionId: dto.internalSessionId,
          email: dto.email,
          brazeSession: dto.brazeSession,
          amplitudeSession: dto.amplitudeSession,
          brandId: dto.brandId
        });
      }
      
      return res.records[0].get('s').properties;
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Get customer's single session
  async getCustomerSession(dto: GetCustomerSessionDto) {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(GET_CUSTOMER_SESSION, {
        internalSessionId: dto.internalSessionId,
      });
      
      if (res.records.length === 0) {
        return null;
      }
      
      const record = res.records[0];
      const customer = record.get('c').properties;
      const sessionData = record.get('s')?.properties;
      const brandData = record.get('b')?.properties;
      
      return {
        customer,
        session: sessionData,
        brand: brandData
      };
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Get all customers with their sessions
  async getAllCustomersWithSessions() {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(GET_ALL_CUSTOMERS_WITH_SESSIONS);
      
      return res.records.map(record => {
        const customer = record.get('c').properties;
        const sessionData = record.get('s')?.properties;
        const brandData = record.get('b')?.properties;
        
        return {
          customer,
          session: sessionData,
          brand: brandData
        };
      });
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Get customer loyalty profile (simplified)
  async getCustomerLoyaltyProfile(internalSessionId: string) {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(GET_CUSTOMER_LOYALTY_PROFILE, {
        internalSessionId,
      });
      
      if (res.records.length === 0) {
        return null;
      }
      
      const record = res.records[0];
      const customer = record.get('c').properties;
      const sessionData = record.get('s')?.properties;
      const brandData = record.get('b')?.properties;
      
      return {
        customer,
        session: sessionData,
        brand: brandData,
        loyaltyMetrics: {
          hasSession: !!sessionData,
          lastActivity: sessionData?.lastSeenAt,
          currentBrand: brandData
        }
      };
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Legacy method for backward compatibility
  async identify(dto: IdentifyDto) {
    // This now creates/updates a customer session if internalSessionId is provided
    if (!dto.internalSessionId) {
      throw new Error('Internal session ID is required for session creation');
    }
    
    // Map provider to appropriate session field
    let brazeSession = null;
    let amplitudeSession = null;
    
    if (dto.provider === 'braze' && dto.externalSessionId) {
      brazeSession = dto.externalSessionId;
    } else if (dto.provider === 'amplitude' && dto.externalSessionId) {
      amplitudeSession = dto.externalSessionId;
    }
    
    return this.createOrUpdateCustomerSession({
      internalSessionId: dto.internalSessionId,
      email: dto.email,
      brazeSession,
      amplitudeSession,
      brandId: dto.brandId
    });
  }

  // Legacy method for backward compatibility
  async linkOnLogin(dto: LoginLinkDto) {
    if (!dto.internalSessionId) {
      throw new Error('Internal session ID is required for session linking');
    }
    
    // Map provider to appropriate session field
    let brazeSession = null;
    let amplitudeSession = null;
    
    if (dto.provider === 'braze' && dto.externalSessionId) {
      brazeSession = dto.externalSessionId;
    } else if (dto.provider === 'amplitude' && dto.externalSessionId) {
      amplitudeSession = dto.externalSessionId;
    }
    
    return this.createOrUpdateCustomerSession({
      internalSessionId: dto.internalSessionId,
      email: dto.email,
      brazeSession,
      amplitudeSession,
      brandId: dto.brandId
    });
  }
}
