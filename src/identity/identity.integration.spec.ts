import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { Neo4jService } from '../common/neo4j/neo4j.service';

describe('Identity Integration Tests', () => {
  let app: INestApplication;
  let neo4jService: Neo4jService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Set up validation pipe
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    
    await app.init();

    neo4jService = moduleFixture.get<Neo4jService>(Neo4jService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Endpoints', () => {
    it('/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.timestamp).toBeDefined();
        });
    });

    it('/health/test (GET)', () => {
      return request(app.getHttpServer())
        .get('/health/test')
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Service is working!');
          expect(res.body.timestamp).toBeDefined();
        });
    });
  });

  describe('Brand Management', () => {
    it('/identity/brand (POST) - should create a brand', () => {
      const brandData = {
        id: 'test-brand-1',
        name: 'Test Brand 1',
        slug: 'test-brand-1',
      };

      return request(app.getHttpServer())
        .post('/identity/brand')
        .send(brandData)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBe(brandData.id);
          expect(res.body.name).toBe(brandData.name);
          expect(res.body.slug).toBe(brandData.slug);
        });
    });

    it('/identity/brand (POST) - should validate required fields', () => {
      const invalidBrandData = {
        id: 'test-brand-2',
        // Missing name and slug
      };

      return request(app.getHttpServer())
        .post('/identity/brand')
        .send(invalidBrandData)
        .expect(400);
    });
  });

  describe('Session Identification', () => {
    it('/identity/identify (POST) - should identify a session', () => {
      const sessionData = {
        provider: 'amplitude',
        externalSessionId: 'amp_sess_integration_123',
        brandId: 'test-brand-1',
      };

      return request(app.getHttpServer())
        .post('/identity/identify')
        .send(sessionData)
        .expect(201)
        .expect((res) => {
          expect(res.body.provider).toBe(sessionData.provider);
          expect(res.body.externalId).toBe(sessionData.externalSessionId);
          expect(res.body.id).toBeDefined();
        });
    });

    it('/identity/identify (POST) - should validate required fields', () => {
      const invalidSessionData = {
        provider: 'amplitude',
        // Missing externalSessionId and brandId
      };

      return request(app.getHttpServer())
        .post('/identity/identify')
        .send(invalidSessionData)
        .expect(400);
    });

    it('/identity/identify (POST) - should validate provider enum', () => {
      const invalidSessionData = {
        provider: 'invalid-provider',
        externalSessionId: 'amp_sess_integration_123',
        brandId: 'test-brand-1',
      };

      return request(app.getHttpServer())
        .post('/identity/identify')
        .send(invalidSessionData)
        .expect(400);
    });
  });

  describe('Customer Linking', () => {
    it('/identity/link-login (POST) - should link session to customer', () => {
      const linkData = {
        provider: 'amplitude',
        externalSessionId: 'amp_sess_integration_123',
        brandId: 'test-brand-1',
        email: 'integration@example.com',
      };

      return request(app.getHttpServer())
        .post('/identity/link-login')
        .send(linkData)
        .expect(201)
        .expect((res) => {
          expect(res.body.email).toBe(linkData.email);
          expect(res.body.id).toBeDefined();
        });
    });

    it('/identity/link-login (POST) - should validate email format', () => {
      const invalidLinkData = {
        provider: 'amplitude',
        externalSessionId: 'amp_sess_invalid_email',
        brandId: 'test-brand-1',
        email: 'invalid-email',
      };

      return request(app.getHttpServer())
        .post('/identity/link-login')
        .send(invalidLinkData)
        .expect(400);
    });
  });

  describe('Customer Lookup', () => {
    it('/identity/customer-for-session (GET) - should return customer for session', () => {
      return request(app.getHttpServer())
        .get('/identity/customer-for-session')
        .query({
          provider: 'amplitude',
          externalSessionId: 'amp_sess_integration_123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('integration@example.com');
          expect(res.body.id).toBeDefined();
        });
    });

    it('/identity/customer-for-session (GET) - should return null for unknown session', () => {
      return request(app.getHttpServer())
        .get('/identity/customer-for-session')
        .query({
          provider: 'amplitude',
          externalSessionId: 'amp_sess_unknown_999',
        })
        .expect(200)
        .expect((res) => {
          // Neo4j returns empty object when no match found
          expect(res.body).toEqual({});
        });
    });
  });
});
