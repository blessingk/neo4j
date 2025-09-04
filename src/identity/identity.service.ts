import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../common/neo4j/neo4j.service';
import { IdentifyDto, Provider } from './dto/identify.dto';
import { LoginLinkDto } from './dto/login-link.dto';
import { 
  QuickIdentifyDto, 
  QuickIdentifyInternalDto,
  LinkExternalSessionDto,
  LinkInternalSessionDto,
  GetCustomerSessionsDto,
  FindCustomerDto
} from './dto/enhanced-session.dto';
import {
  UPSERT_BRAND, 
  UPSERT_SESSION,
  UPSERT_INTERNAL_SESSION,
  QUICK_IDENTIFY_BY_EXTERNAL_SESSION,
  QUICK_IDENTIFY_BY_INTERNAL_SESSION,
  LINK_EXTERNAL_SESSION_TO_CUSTOMER,
  LINK_INTERNAL_SESSION_TO_CUSTOMER,
  LINK_INTERNAL_TO_EXISTING_SESSIONS,
  GET_CUSTOMER_WITH_ALL_SESSIONS,
  FIND_CUSTOMER_BY_ANY_SESSION,
  GET_CUSTOMER_LATEST_SESSION
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

  // Called on each visit or event ping (anonymous allowed)
  async identify(dto: IdentifyDto) {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(UPSERT_SESSION, {
        brandId: dto.brandId,
        provider: dto.provider,
        externalSessionId: dto.externalSessionId,
      });
      return res.records[0].get('s').properties;
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Create internal session (our single source of truth)
  async createInternalSession(internalSessionId: string, brandId: string) {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(UPSERT_INTERNAL_SESSION, {
        internalSessionId,
        brandId,
      });
      return res.records[0].get('s').properties;
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Quick identification by stable external sessions (Braze/Amplitude)
  async quickIdentifyByExternalSession(dto: QuickIdentifyDto) {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(QUICK_IDENTIFY_BY_EXTERNAL_SESSION, {
        provider: dto.provider,
        externalSessionId: dto.externalSessionId,
      });
      
      if (res.records.length === 0) {
        return { session: null, customer: null };
      }
      
      const record = res.records[0];
      const sessionData = record.get('s')?.properties;
      const customerData = record.get('c')?.properties;
      
      return {
        session: sessionData,
        customer: customerData && Object.keys(customerData).length > 0 ? customerData : null
      };
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Quick identification by internal session (after login)
  async quickIdentifyByInternalSession(dto: QuickIdentifyInternalDto) {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(QUICK_IDENTIFY_BY_INTERNAL_SESSION, {
        internalSessionId: dto.internalSessionId,
      });
      
      if (res.records.length === 0) {
        return { session: null, customer: null };
      }
      
      const record = res.records[0];
      const sessionData = record.get('s')?.properties;
      const customerData = record.get('c')?.properties;
      
      return {
        session: sessionData,
        customer: customerData && Object.keys(customerData).length > 0 ? customerData : null
      };
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Link external session to customer (first identification)
  async linkExternalSessionToCustomer(dto: LinkExternalSessionDto) {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(LINK_EXTERNAL_SESSION_TO_CUSTOMER, {
        email: dto.email,
        provider: dto.provider,
        externalSessionId: dto.externalSessionId,
      });
      return res.records[0].get('c').properties;
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Link internal session to customer (after login)
  async linkInternalSessionToCustomer(dto: LinkInternalSessionDto) {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(LINK_INTERNAL_SESSION_TO_CUSTOMER, {
        email: dto.email,
        internalSessionId: dto.internalSessionId,
      });
      return res.records[0].get('c').properties;
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Link internal session to existing external sessions (stitching)
  async linkInternalToExistingSessions(dto: LinkInternalSessionDto) {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(LINK_INTERNAL_TO_EXISTING_SESSIONS, {
        email: dto.email,
        internalSessionId: dto.internalSessionId,
      });
      return res.records[0].get('c').properties;
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Called once user authenticates; links session -> customer (legacy method)
  async linkOnLogin(dto: LoginLinkDto) {
    let session;
    
    // Check for linking attributes before trying database operations
    if (!dto.email && !dto.phone && !dto.customerId) {
      throw new Error('No linking attribute provided (email/phone/identity).');
    }

    try {
      session = this.neo.session();
      if (dto.email) {
        const res = await session.run(LINK_EXTERNAL_SESSION_TO_CUSTOMER, {
          email: dto.email,
          provider: dto.provider,
          externalSessionId: dto.externalSessionId,
        });
        return res.records[0].get('c').properties;
      }
      // You can add phone-based or identity-based linking variants here.
      throw new Error('No linking attribute provided (email/phone/identity).');
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Resolve: do we already know who this session belongs to? (legacy method)
  async getCustomerForSession(provider: Provider, externalSessionId: string) {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(QUICK_IDENTIFY_BY_EXTERNAL_SESSION, { 
        provider, 
        externalSessionId 
      });
      
      if (res.records.length === 0) {
        return null;
      }
      
      const customer = res.records[0]?.get('c')?.properties;
      return customer && Object.keys(customer).length > 0 ? customer : null;
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Find customer by any session type
  async findCustomerByAnySession(dto: FindCustomerDto) {
    let session;
    try {
      session = this.neo.session();
      
      let res;
      
      if (dto.internalSessionId) {
        // Look up by internal session
        res = await session.run(QUICK_IDENTIFY_BY_INTERNAL_SESSION, {
          internalSessionId: dto.internalSessionId,
        });
      } else if (dto.provider && dto.externalSessionId) {
        // Look up by external session
        res = await session.run(QUICK_IDENTIFY_BY_EXTERNAL_SESSION, {
          provider: dto.provider,
          externalSessionId: dto.externalSessionId,
        });
      } else {
        throw new Error('Either internalSessionId or both provider and externalSessionId must be provided');
      }
      
      if (res.records.length === 0) {
        return null;
      }
      
      const customer = res.records[0]?.get('c')?.properties;
      return customer && Object.keys(customer).length > 0 ? customer : null;
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Get all sessions for a customer
  async getCustomerWithSessions(dto: GetCustomerSessionsDto) {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(GET_CUSTOMER_WITH_ALL_SESSIONS, {
        email: dto.email,
      });
      
      if (res.records.length === 0) {
        return null;
      }
      
      const record = res.records[0];
      const customer = record.get('c').properties;
      const sessions = record.get('sessions').map((s: any) => s.properties);
      
      return {
        customer,
        sessions: sessions.filter((s: any) => s !== null),
      };
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }

  // Get customer's latest session
  async getCustomerLatestSession(email: string) {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(GET_CUSTOMER_LATEST_SESSION, {
        email,
      });
      
      if (res.records.length === 0) {
        return null;
      }
      
      return res.records[0].get('s').properties;
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }
}
