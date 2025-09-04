import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../common/neo4j/neo4j.service';
import { IdentifyDto, Provider } from './dto/identify.dto';
import { LoginLinkDto } from './dto/login-link.dto';
import {
  UPSERT_BRAND, 
  UPSERT_SESSION,
  LOOKUP_SESSION_CUSTOMER, 
  LINK_SESSION_TO_CUSTOMER_BY_EMAIL
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

  // Called once user authenticates; links session -> customer
  async linkOnLogin(dto: LoginLinkDto) {
    let session;
    
    // Check for linking attributes before trying database operations
    if (!dto.email && !dto.phone && !dto.customerId) {
      throw new Error('No linking attribute provided (email/phone/identity).');
    }

    try {
      session = this.neo.session();
      if (dto.email) {
        const res = await session.run(LINK_SESSION_TO_CUSTOMER_BY_EMAIL, {
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

  // Resolve: do we already know who this session belongs to?
  async getCustomerForSession(provider: Provider, externalSessionId: string) {
    let session;
    try {
      session = this.neo.session();
      const res = await session.run(LOOKUP_SESSION_CUSTOMER, { provider, externalSessionId });
      
      // If no records returned, return null
      if (res.records.length === 0) {
        return null;
      }
      
      const customer = res.records[0]?.get('c')?.properties;
      // Return null if customer is undefined, null, or empty object
      return customer && Object.keys(customer).length > 0 ? customer : null;
    } catch (error) {
      console.error('Neo4j operation failed:', error.message);
      throw new Error('Database operation failed');
    } finally { 
      if (session) await session.close(); 
    }
  }
}
