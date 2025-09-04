import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Loyalty Program E2E Tests', () => {
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

  describe('Unified Customer Identity for Loyalty Program', () => {
    const timestamp = Date.now();
    const customerEmail = `loyalty-test-${timestamp}@example.com`;
    const brand1Id = `brand-1-${timestamp}`;
    const brand2Id = `brand-2-${timestamp}`;
    const brazeSessionId = `braze-session-${timestamp}`;
    const amplitudeSessionId = `amplitude-session-${timestamp}`;
    const internalSessionId = `internal-session-${timestamp}`;

    it('should create brands for loyalty program', async () => {
      // Create first brand
      await request(app.getHttpServer())
        .post('/identity/brand')
        .send({
          id: brand1Id,
          name: 'Brand One',
          slug: 'brand-one'
        })
        .expect(201);

      // Create second brand
      await request(app.getHttpServer())
        .post('/identity/brand')
        .send({
          id: brand2Id,
          name: 'Brand Two',
          slug: 'brand-two'
        })
        .expect(201);
    });

    it('should track customer activity across multiple brands', async () => {
      // Customer visits Brand One with Braze session
      await request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          provider: 'braze',
          externalSessionId: brazeSessionId,
          brandId: brand1Id
        })
        .expect(201);

      // Customer visits Brand Two with Amplitude session
      await request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          provider: 'amplitude',
          externalSessionId: amplitudeSessionId,
          brandId: brand2Id
        })
        .expect(201);

      // Customer logs in on Brand One (internal session)
      await request(app.getHttpServer())
        .post('/identity/internal-session')
        .send({
          internalSessionId: internalSessionId,
          brandId: brand1Id
        })
        .expect(201);
    });

    it('should link customer sessions across brands', async () => {
      // Link Braze session to customer
      await request(app.getHttpServer())
        .post('/identity/link-external-session')
        .send({
          email: customerEmail,
          provider: 'braze',
          externalSessionId: brazeSessionId,
          brandId: brand1Id
        })
        .expect(201);

      // Link Amplitude session to customer
      await request(app.getHttpServer())
        .post('/identity/link-external-session')
        .send({
          email: customerEmail,
          provider: 'amplitude',
          externalSessionId: amplitudeSessionId,
          brandId: brand2Id
        })
        .expect(201);

      // Link internal session to customer
      await request(app.getHttpServer())
        .post('/identity/link-internal-session')
        .send({
          email: customerEmail,
          internalSessionId: internalSessionId,
          brandId: brand1Id
        })
        .expect(201);
    });

    it('should identify customer by any session across brands', async () => {
      // Find customer by Braze session
      const customerByBraze = await request(app.getHttpServer())
        .get('/identity/find-customer')
        .query({
          provider: 'braze',
          externalSessionId: brazeSessionId
        })
        .expect(200);

      expect(customerByBraze.body.email).toBe(customerEmail);

      // Find customer by Amplitude session
      const customerByAmplitude = await request(app.getHttpServer())
        .get('/identity/find-customer')
        .query({
          provider: 'amplitude',
          externalSessionId: amplitudeSessionId
        })
        .expect(200);

      expect(customerByAmplitude.body.email).toBe(customerEmail);

      // Find customer by internal session
      const customerByInternal = await request(app.getHttpServer())
        .get('/identity/find-customer')
        .query({
          internalSessionId: internalSessionId
        })
        .expect(200);

      expect(customerByInternal.body.email).toBe(customerEmail);
    });

    it('should get unified customer loyalty profile', async () => {
      const loyaltyProfile = await request(app.getHttpServer())
        .get('/identity/customer-loyalty-profile')
        .query({ email: customerEmail })
        .expect(200);

      expect(loyaltyProfile.body.customer.email).toBe(customerEmail);
      expect(loyaltyProfile.body.loyaltyMetrics.totalSessions).toBe(3);
      expect(loyaltyProfile.body.loyaltyMetrics.totalBrands).toBe(2);
      expect(loyaltyProfile.body.loyaltyMetrics.crossBrandActivity).toBe(true);
      expect(loyaltyProfile.body.brands).toHaveLength(2);
      expect(loyaltyProfile.body.sessions).toHaveLength(3);
    });

    it('should get customer with all sessions across brands', async () => {
      const customerWithSessions = await request(app.getHttpServer())
        .get('/identity/customer-with-sessions')
        .query({ email: customerEmail })
        .expect(200);

      expect(customerWithSessions.body.customer.email).toBe(customerEmail);
      expect(customerWithSessions.body.sessions).toHaveLength(3);
      expect(customerWithSessions.body.brands).toHaveLength(2);
    });

    it('should get all customers with cross-brand activity', async () => {
      const allCustomers = await request(app.getHttpServer())
        .get('/identity/all-customers-activity')
        .expect(200);

      expect(Array.isArray(allCustomers.body)).toBe(true);
      
      // Find our test customer
      const testCustomer = allCustomers.body.find((c: any) => c.customer.email === customerEmail);
      expect(testCustomer).toBeDefined();
      expect(testCustomer.loyaltyMetrics.sessionCount).toBe(3);
      expect(testCustomer.loyaltyMetrics.brandCount).toBe(2);
      expect(testCustomer.loyaltyMetrics.crossBrandActivity).toBe(true);
    });
  });

  describe('Loyalty Program Business Logic', () => {
    const timestamp = Date.now();
    const customerEmail = `loyalty-business-${timestamp}@example.com`;
    const brandId = `brand-business-${timestamp}`;
    const sessionId = `session-business-${timestamp}`;

    it('should handle single brand customers', async () => {
      // Create brand
      await request(app.getHttpServer())
        .post('/identity/brand')
        .send({
          id: brandId,
          name: 'Single Brand',
          slug: 'single-brand'
        })
        .expect(201);

      // Create and link session
      await request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          provider: 'braze',
          externalSessionId: sessionId,
          brandId: brandId
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/identity/link-external-session')
        .send({
          email: customerEmail,
          provider: 'braze',
          externalSessionId: sessionId,
          brandId: brandId
        })
        .expect(201);

      // Check loyalty profile
      const loyaltyProfile = await request(app.getHttpServer())
        .get('/identity/customer-loyalty-profile')
        .query({ email: customerEmail })
        .expect(200);

      expect(loyaltyProfile.body.loyaltyMetrics.totalSessions).toBe(1);
      expect(loyaltyProfile.body.loyaltyMetrics.totalBrands).toBe(1);
      expect(loyaltyProfile.body.loyaltyMetrics.crossBrandActivity).toBe(false);
    });

    it('should handle customers with no brand association', async () => {
      const noBrandEmail = `no-brand-${timestamp}@example.com`;
      const noBrandSessionId = `no-brand-session-${timestamp}`;

      // Create session without brand
      await request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          provider: 'braze',
          externalSessionId: noBrandSessionId
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/identity/link-external-session')
        .send({
          email: noBrandEmail,
          provider: 'braze',
          externalSessionId: noBrandSessionId
        })
        .expect(201);

      // Check loyalty profile
      const loyaltyProfile = await request(app.getHttpServer())
        .get('/identity/customer-loyalty-profile')
        .query({ email: noBrandEmail })
        .expect(200);

      expect(loyaltyProfile.body.loyaltyMetrics.totalSessions).toBe(1);
      expect(loyaltyProfile.body.loyaltyMetrics.totalBrands).toBe(0);
      expect(loyaltyProfile.body.loyaltyMetrics.crossBrandActivity).toBe(false);
    });
  });
});
