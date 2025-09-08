import { Neogma, ModelFactory } from 'neogma';

export class Neo4jOGMService {
  private neogma: Neogma;
  private initializedModels: any = {};

  constructor() {
    this.neogma = new Neogma({
      url: process.env.NEO4J_URI!,
      username: process.env.NEO4J_USER!,
      password: process.env.NEO4J_PASSWORD!,
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.neogma.verifyConnectivity();
      
      // Create models with neogma instance following the documentation format
      this.initializedModels.Brand = ModelFactory(
        {
          label: 'Brand',
          schema: {
            id: {
              type: 'string',
              minLength: 1,
              required: true,
            },
            name: {
              type: 'string',
              minLength: 1,
              required: true,
            },
            slug: {
              type: 'string',
              minLength: 1,
              required: true,
            },
          },
          primaryKeyField: 'id',
          relationships: {},
        },
        this.neogma
      );

      this.initializedModels.Session = ModelFactory(
        {
          label: 'Session',
          schema: {
            id: {
              type: 'string',
              minLength: 1,
              required: true,
            },
            internalSessionId: {
              type: 'string',
              minLength: 1,
              required: true,
            },
            brazeSession: {
              type: 'string',
              required: false,
            },
            amplitudeSession: {
              type: 'string',
              required: false,
            },
            email: {
              type: 'string',
              required: false,
            },
            brandId: {
              type: 'string',
              minLength: 1,
              required: true,
            },
            createdAt: {
              type: 'string',
              required: true,
            },
            lastSeenAt: {
              type: 'string',
              required: true,
            },
          },
          primaryKeyField: 'id',
          relationships: {},
        },
        this.neogma
      );

      this.initializedModels.Customer = ModelFactory( 
        {
          label: 'Customer',
          schema: {
            id: {
              type: 'string',
              minLength: 1,
              required: true,
            },
            internalSessionId: {
              type: 'string',
              minLength: 1,
              required: true,
            },
            email: {
              type: 'string',
              required: false,
            },
            phone: {
              type: 'string',
              required: false,
            },
            createdAt: {
              type: 'string',
              required: true,
            },
          },
          primaryKeyField: 'id',
          relationships: {},
        },
        this.neogma
      );

      this.initializedModels.Identity = ModelFactory(
        {
          label: 'Identity',
          schema: {
            id: {
              type: 'string',
              minLength: 1,
              required: true,
            },
            provider: {
              type: 'string',
              minLength: 1,
              required: true,
            },
            externalId: {
              type: 'string',
              minLength: 1,
              required: true,
            },
            createdAt: {
              type: 'string',
              required: true,
            },
          },
          primaryKeyField: 'id',
        },
        this.neogma
      );
      
      console.log('✅ Connected to Neo4j with OGM successfully');
    } catch (error) {
      console.warn('⚠️  Neo4j OGM connection failed, but continuing startup:', error.message);
    }
  }

  async close(): Promise<void> {
    try {
      await this.neogma.driver.close();
      console.log('Neo4j OGM service closed');
    } catch (error) {
      console.warn('Error closing Neo4j OGM:', error.message);
    }
  }

  getNeogma(): Neogma {
    return this.neogma;
  }

  // Convenience methods for each model following OGM patterns
  getBrand() {
    return this.initializedModels.Brand;
  }

  getSession() {
    return this.initializedModels.Session;
  }

  getCustomer() {
    return this.initializedModels.Customer;
  }

  getIdentity() {
    return this.initializedModels.Identity;
  }
}
