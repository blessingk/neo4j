import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Single Session Per Customer E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('One Long-Lived Session Per Customer', () => {
    const timestamp = Date.now();
    const customerEmail = `single-session-${timestamp}@example.com`;
    const brandId = `brand-${timestamp}`;
    const sessionId = `session-${timestamp}`;

    it('should create brand', async () => {
      await request(app.getHttpServer())
        .post('/identity/brand')
        .send({
          id: brandId,
          name: 'Test Brand',
          slug: 'test-brand'
        })
        .expect(201);
    });

    it('should create customer with single session', async () => {
      const response = await request(app.getHttpServer())
        .post('/identity/customer-session')
        .send({
          email: customerEmail,
          provider: 'braze',
          externalSessionId: sessionId,
          brandId: brandId
        })
        .expect(201);

      expect(response.body.customer.email).toBe(customerEmail);
      expect(response.body.session.customerEmail).toBe(customerEmail);
      expect(response.body.session.provider).toBe('braze');
      expect(response.body.session.externalId).toBe(sessionId);
    });

    it('should identify customer by email', async () => {
      const response = await request(app.getHttpServer())
        .get('/identity/quick-identify-customer')
        .query({ email: customerEmail })
        .expect(200);

      expect(response.body.customer.email).toBe(customerEmail);
      expect(response.body.session.customerEmail).toBe(customerEmail);
      expect(response.body.session.provider).toBe('braze');
    });

    it('should find customer by session identifier', async () => {
      const response = await request(app.getHttpServer())
        .get('/identity/find-customer-by-session')
        .query({
          provider: 'braze',
          externalSessionId: sessionId
        })
        .expect(200);

      expect(response.body.customer.email).toBe(customerEmail);
      expect(response.body.session.customerEmail).toBe(customerEmail);
    });

    it('should update customer session', async () => {
      const newSessionId = `new-session-${timestamp}`;
      
      const response = await request(app.getHttpServer())
        .post('/identity/update-customer-session')
        .send({
          email: customerEmail,
          provider: 'amplitude',
          externalSessionId: newSessionId,
          brandId: brandId
        })
        .expect(201);

      expect(response.body.provider).toBe('amplitude');
      expect(response.body.externalId).toBe(newSessionId);
    });

    it('should get customer session', async () => {
      const response = await request(app.getHttpServer())
        .get('/identity/customer-session')
        .query({ email: customerEmail })
        .expect(200);

      expect(response.body.customer.email).toBe(customerEmail);
      expect(response.body.session.customerEmail).toBe(customerEmail);
    });

    it('should get customer loyalty profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/identity/customer-loyalty-profile')
        .query({ email: customerEmail })
        .expect(200);

      expect(response.body.customer.email).toBe(customerEmail);
      expect(response.body.loyaltyMetrics.hasSession).toBe(true);
      expect(response.body.loyaltyMetrics.lastActivity).toBeDefined();
    });

    it('should get all customers with sessions', async () => {
      const response = await request(app.getHttpServer())
        .get('/identity/all-customers-sessions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      const testCustomer = response.body.find((c: any) => c.customer.email === customerEmail);
      expect(testCustomer).toBeDefined();
      expect(testCustomer.session.customerEmail).toBe(customerEmail);
    });
  });

  describe('Legacy Endpoint Compatibility', () => {
    const timestamp = Date.now();
    const customerEmail = `legacy-${timestamp}@example.com`;
    const brandId = `legacy-brand-${timestamp}`;
    const sessionId = `legacy-session-${timestamp}`;

    it('should work with legacy identify endpoint', async () => {
      const response = await request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          email: customerEmail,
          provider: 'braze',
          externalSessionId: sessionId,
          brandId: brandId
        })
        .expect(201);

      expect(response.body.customer.email).toBe(customerEmail);
      expect(response.body.session.customerEmail).toBe(customerEmail);
    });

    it('should work with legacy link-login endpoint', async () => {
      const response = await request(app.getHttpServer())
        .post('/identity/link-login')
        .send({
          email: customerEmail,
          provider: 'amplitude',
          externalSessionId: sessionId,
          brandId: brandId
        })
        .expect(201);

      expect(response.body.customer.email).toBe(customerEmail);
      expect(response.body.session.customerEmail).toBe(customerEmail);
    });

    it('should work with legacy customer-for-session endpoint', async () => {
      // First create a customer session
      await request(app.getHttpServer())
        .post('/identity/customer-session')
        .send({
          email: customerEmail,
          provider: 'braze',
          externalSessionId: sessionId,
          brandId: brandId
        })
        .expect(201);

      // Then test the legacy endpoint
      const response = await request(app.getHttpServer())
        .get('/identity/customer-for-session')
        .query({
          provider: 'braze',
          externalSessionId: sessionId
        })
        .expect(200);

      expect(response.body.email).toBe(customerEmail);
    });
  });
});
