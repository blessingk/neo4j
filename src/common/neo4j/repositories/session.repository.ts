import { Injectable, Inject } from '@nestjs/common';
import { Neo4jOGMService } from '../neo4j-ogm.service';
import { 
  SessionInstance,
  CustomerSessionResult,
  CustomerSessionBrandResult,
  CreateOrUpdateCustomerSessionData,
  UpdateCustomerSessionData,
  FindCustomerBySessionData
} from '../types';

@Injectable()
export class SessionRepository {
  constructor(@Inject('NEO4J_OGM') private readonly ogmService: Neo4jOGMService) {}

  async createOrUpdateCustomerSession(data: CreateOrUpdateCustomerSessionData): Promise<CustomerSessionResult | null> {
    try {
      const Session = this.ogmService.getSession();
      const Customer = this.ogmService.getCustomer();
      const Brand = this.ogmService.getBrand();

      // Find or create customer
      let customer = await Customer.findOne({
        where: { internalSessionId: data.internalSessionId },
      });

      if (!customer) {
        customer = await Customer.createOne({
          id: this.generateId(),
          internalSessionId: data.internalSessionId,
          email: data.email || null,
          createdAt: new Date().toISOString(),
        });
      } else if (data.email) {
        customer.email = data.email;
        customer = await customer.save();
      }

      // Find or create session
      let session = await Session.findOne({
        where: { internalSessionId: data.internalSessionId },
      });

      const sessionData = {
        id: this.generateId(),
        internalSessionId: data.internalSessionId,
        brazeSession: data.brazeSession || null,
        amplitudeSession: data.amplitudeSession || null,
        email: data.email || null,
        brandId: data.brandId,
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      };

      if (!session) {
        session = await Session.createOne(sessionData);
      } else {
        // Update existing session
        session.brazeSession = data.brazeSession || null;
        session.amplitudeSession = data.amplitudeSession || null;
        session.email = data.email || null;
        session.brandId = data.brandId;
        session.lastSeenAt = new Date().toISOString();
        session = await session.save();
      }

      return { customer, session };
    } catch (error) {
      console.error('Session createOrUpdate failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  async quickIdentifyCustomer(internalSessionId: string): Promise<CustomerSessionBrandResult> {
    try {
      if (!internalSessionId) {
        return { session: null, customer: null, brand: null };
      }

      const Session = this.ogmService.getSession();
      
      const session = await Session.findOne({
        where: { internalSessionId },
      });

      if (!session) {
        return { session: null, customer: null, brand: null };
      }

      // Find related customer and brand using raw queries for now
      const neogma = this.ogmService.getNeogma();
      const driverSession = neogma.driver.session();
      
      try {
        const customerResult = await driverSession.run(
          `MATCH (s:Session {internalSessionId: $internalSessionId})-[:BELONGS_TO]->(c:Customer) RETURN c`,
          { internalSessionId }
        );
        
        const brandResult = await driverSession.run(
          `MATCH (s:Session {internalSessionId: $internalSessionId})-[:FOR_BRAND]->(b:Brand) RETURN b`,
          { internalSessionId }
        );
        
        const customer = customerResult.records[0]?.get('c')?.properties || null;
        const brand = brandResult.records[0]?.get('b')?.properties || null;
        
        return { session, customer, brand };
      } finally {
        await driverSession.close();
      }
    } catch (error) {
      console.error('Session quickIdentify failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  async findCustomerBySession(data: FindCustomerBySessionData): Promise<CustomerSessionBrandResult> {
    try {
      const Session = this.ogmService.getSession();
      
      const whereClause: any = {};
      if (data.brazeSession) whereClause.brazeSession = data.brazeSession;
      if (data.amplitudeSession) whereClause.amplitudeSession = data.amplitudeSession;
      if (data.internalSessionId) whereClause.internalSessionId = data.internalSessionId;
      if (data.email) whereClause.email = data.email;

      const session = await Session.findOne({
        where: whereClause,
      });

      if (!session) {
        return { session: null, customer: null, brand: null };
      }

      // Find related customer and brand using raw queries
      const neogma = this.ogmService.getNeogma();
      const driverSession = neogma.driver.session();
      
      try {
        const customerResult = await driverSession.run(
          `MATCH (s:Session)-[:BELONGS_TO]->(c:Customer) WHERE s.internalSessionId = $internalSessionId RETURN c`,
          { internalSessionId: session.internalSessionId }
        );
        
        const brandResult = await driverSession.run(
          `MATCH (s:Session)-[:FOR_BRAND]->(b:Brand) WHERE s.internalSessionId = $internalSessionId RETURN b`,
          { internalSessionId: session.internalSessionId }
        );
        
        const customer = customerResult.records[0]?.get('c')?.properties || null;
        const brand = brandResult.records[0]?.get('b')?.properties || null;
        
        return { session, customer, brand };
      } finally {
        await driverSession.close();
      }
    } catch (error) {
      console.error('Session findCustomerBySession failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  async updateCustomerSession(data: UpdateCustomerSessionData): Promise<SessionInstance | null> {
    try {
      const Session = this.ogmService.getSession();
      
      const session = await Session.findOne({
        where: { internalSessionId: data.internalSessionId },
      });

      if (!session) {
        return null;
      }

      // Update session data
      session.lastSeenAt = new Date().toISOString();
      session.brandId = data.brandId;
      
      if (data.email !== undefined) session.email = data.email;
      if (data.brazeSession !== undefined) session.brazeSession = data.brazeSession;
      if (data.amplitudeSession !== undefined) session.amplitudeSession = data.amplitudeSession;

      const updatedSession = await session.save();

      return updatedSession;
    } catch (error) {
      console.error('Session update failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}