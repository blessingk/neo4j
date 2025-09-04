import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Customer Identity E2E Tests', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Customer Journey', () => {
    it('should handle complete customer identification flow', async () => {
      const brandId = `e2e-brand-${Date.now()}`;
      const sessionId = `e2e_sess_${Date.now()}`;
      const customerEmail = `e2e-${Date.now()}@example.com`;

      // Step 1: Create a brand
      const brandResponse = await request(app.getHttpServer())
        .post('/identity/brand')
        .send({
          id: brandId,
          name: 'E2E Test Brand',
          slug: 'e2e-test-brand',
        })
        .expect(201);

      expect(brandResponse.body.id).toBe(brandId);

      // Step 2: Identify anonymous session
      const sessionResponse = await request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          provider: 'amplitude',
          externalSessionId: sessionId,
          brandId: brandId,
        })
        .expect(201);

      expect(sessionResponse.body.externalId).toBe(sessionId);
      expect(sessionResponse.body.provider).toBe('amplitude');

      // Step 3: Check that session is not linked to any customer yet
      const customerCheckResponse = await request(app.getHttpServer())
        .get('/identity/customer-for-session')
        .query({
          provider: 'amplitude',
          externalSessionId: sessionId,
        })
        .expect(200);

      expect(customerCheckResponse.body).toEqual({});

      // Step 4: Link session to customer on login
      const linkResponse = await request(app.getHttpServer())
        .post('/identity/link-login')
        .send({
          provider: 'amplitude',
          externalSessionId: sessionId,
          brandId: brandId,
          email: customerEmail,
        })
        .expect(201);

      expect(linkResponse.body.email).toBe(customerEmail);
      expect(linkResponse.body.id).toBeDefined();

      // Step 5: Verify session is now linked to customer
      const finalCustomerResponse = await request(app.getHttpServer())
        .get('/identity/customer-for-session')
        .query({
          provider: 'amplitude',
          externalSessionId: sessionId,
        })
        .expect(200);

      expect(finalCustomerResponse.body.email).toBe(customerEmail);
      expect(finalCustomerResponse.body.id).toBe(linkResponse.body.id);
    });

    it('should handle multiple sessions for same customer', async () => {
      const brandId = `e2e-brand-multi-${Date.now()}`;
      const customerEmail = `multi-session-${Date.now()}@example.com`;
      const session1 = `multi_sess_1_${Date.now()}`;
      const session2 = `multi_sess_2_${Date.now()}`;

      // Create brand
      await request(app.getHttpServer())
        .post('/identity/brand')
        .send({
          id: brandId,
          name: 'Multi Session Brand',
          slug: 'multi-session-brand',
        })
        .expect(201);

      // Create first session
      await request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          provider: 'amplitude',
          externalSessionId: session1,
          brandId: brandId,
        })
        .expect(201);

      // Create second session
      await request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          provider: 'braze',
          externalSessionId: session2,
          brandId: brandId,
        })
        .expect(201);

      // Link first session to customer
      const linkResponse1 = await request(app.getHttpServer())
        .post('/identity/link-login')
        .send({
          provider: 'amplitude',
          externalSessionId: session1,
          brandId: brandId,
          email: customerEmail,
        })
        .expect(201);

      // Link second session to same customer
      const linkResponse2 = await request(app.getHttpServer())
        .post('/identity/link-login')
        .send({
          provider: 'braze',
          externalSessionId: session2,
          brandId: brandId,
          email: customerEmail,
        })
        .expect(201);

      // Verify both sessions link to same customer
      expect(linkResponse1.body.id).toBe(linkResponse2.body.id);
      expect(linkResponse1.body.email).toBe(customerEmail);
      expect(linkResponse2.body.email).toBe(customerEmail);

      // Verify both sessions can be looked up
      const customer1 = await request(app.getHttpServer())
        .get('/identity/customer-for-session')
        .query({
          provider: 'amplitude',
          externalSessionId: session1,
        })
        .expect(200);

      const customer2 = await request(app.getHttpServer())
        .get('/identity/customer-for-session')
        .query({
          provider: 'braze',
          externalSessionId: session2,
        })
        .expect(200);

      expect(customer1.body.id).toBe(customer2.body.id);
      expect(customer1.body.email).toBe(customerEmail);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid provider gracefully', () => {
      return request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          provider: 'invalid-provider',
          externalSessionId: 'test-session',
          brandId: 'test-brand',
        })
        .expect(400);
    });

    it('should handle missing required fields', () => {
      return request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          provider: 'amplitude',
          // Missing externalSessionId and brandId
        })
        .expect(400);
    });

    it('should handle invalid email format', () => {
      return request(app.getHttpServer())
        .post('/identity/link-login')
        .send({
          provider: 'amplitude',
          externalSessionId: 'test-session',
          brandId: 'test-brand',
          email: 'invalid-email-format',
        })
        .expect(400);
    });
  });
});
