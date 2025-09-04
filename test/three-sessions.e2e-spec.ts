import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Three Session Types E2E Tests', () => {
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

  describe('Three Session Types (Braze, Amplitude, Internal)', () => {
    const timestamp = Date.now();
    const internalSessionId = `internal-${timestamp}`;
    const brazeSessionId = `braze-${timestamp}`;
    const amplitudeSessionId = `amplitude-${timestamp}`;
    const brandId = `brand-${timestamp}`;
    const customerEmail = `customer-${timestamp}@example.com`;

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

    it('should create customer with internal session ID only', async () => {
      const response = await request(app.getHttpServer())
        .post('/identity/customer-session')
        .send({
          internalSessionId: internalSessionId,
          email: customerEmail,
          brandId: brandId
        })
        .expect(201);

      expect(response.body.customer.internalSessionId).toBe(internalSessionId);
      expect(response.body.customer.email).toBe(customerEmail);
      expect(response.body.session.internalSessionId).toBe(internalSessionId);
      expect(response.body.session.brazeSession).toBeUndefined();
      expect(response.body.session.amplitudeSession).toBeUndefined();
    });

    it('should update customer with Braze session', async () => {
      const response = await request(app.getHttpServer())
        .post('/identity/update-customer-session')
        .send({
          internalSessionId: internalSessionId,
          brazeSession: brazeSessionId,
          brandId: brandId
        })
        .expect(201);

      expect(response.body.brazeSession).toBe(brazeSessionId);
      expect(response.body.amplitudeSession).toBeUndefined();
    });

    it('should update customer with Amplitude session', async () => {
      const response = await request(app.getHttpServer())
        .post('/identity/update-customer-session')
        .send({
          internalSessionId: internalSessionId,
          amplitudeSession: amplitudeSessionId,
          brandId: brandId
        })
        .expect(201);

      expect(response.body.brazeSession).toBe(brazeSessionId);
      expect(response.body.amplitudeSession).toBe(amplitudeSessionId);
    });

    it('should find customer by internal session ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/identity/quick-identify-customer')
        .query({ internalSessionId: internalSessionId })
        .expect(200);

      expect(response.body.customer.internalSessionId).toBe(internalSessionId);
      expect(response.body.session.brazeSession).toBe(brazeSessionId);
      expect(response.body.session.amplitudeSession).toBe(amplitudeSessionId);
    });

    it('should find customer by Braze session', async () => {
      const response = await request(app.getHttpServer())
        .get('/identity/find-customer-by-session')
        .query({ brazeSession: brazeSessionId })
        .expect(200);

      expect(response.body.customer.internalSessionId).toBe(internalSessionId);
      expect(response.body.customer.email).toBe(customerEmail);
    });

    it('should find customer by Amplitude session', async () => {
      const response = await request(app.getHttpServer())
        .get('/identity/find-customer-by-session')
        .query({ amplitudeSession: amplitudeSessionId })
        .expect(200);

      expect(response.body.customer.internalSessionId).toBe(internalSessionId);
      expect(response.body.customer.email).toBe(customerEmail);
    });

    it('should find customer by email', async () => {
      const response = await request(app.getHttpServer())
        .get('/identity/find-customer-by-session')
        .query({ email: customerEmail })
        .expect(200);

      expect(response.body.customer.internalSessionId).toBe(internalSessionId);
      expect(response.body.session.brazeSession).toBe(brazeSessionId);
      expect(response.body.session.amplitudeSession).toBe(amplitudeSessionId);
    });

    it('should update customer email', async () => {
      const newEmail = `new-email-${timestamp}@example.com`;
      
      const response = await request(app.getHttpServer())
        .post('/identity/update-customer-session')
        .send({
          internalSessionId: internalSessionId,
          email: newEmail
        })
        .expect(201);

      expect(response.body.email).toBe(newEmail);
    });

    it('should maintain all sessions after email change', async () => {
      const response = await request(app.getHttpServer())
        .get('/identity/quick-identify-customer')
        .query({ internalSessionId: internalSessionId })
        .expect(200);

      expect(response.body.customer.internalSessionId).toBe(internalSessionId);
      expect(response.body.session.brazeSession).toBe(brazeSessionId);
      expect(response.body.session.amplitudeSession).toBe(amplitudeSessionId);
    });

    it('should get customer session with all session types', async () => {
      const response = await request(app.getHttpServer())
        .get('/identity/customer-session')
        .query({ internalSessionId: internalSessionId })
        .expect(200);

      expect(response.body.customer.internalSessionId).toBe(internalSessionId);
      expect(response.body.session.brazeSession).toBe(brazeSessionId);
      expect(response.body.session.amplitudeSession).toBe(amplitudeSessionId);
    });

    it('should get customer loyalty profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/identity/customer-loyalty-profile')
        .query({ internalSessionId: internalSessionId })
        .expect(200);

      expect(response.body.customer.internalSessionId).toBe(internalSessionId);
      expect(response.body.loyaltyMetrics.hasSession).toBe(true);
      expect(response.body.loyaltyMetrics.lastActivity).toBeDefined();
    });
  });

  describe('Legacy Endpoint Compatibility', () => {
    const timestamp = Date.now();
    const internalSessionId = `legacy-${timestamp}`;
    const brazeSessionId = `legacy-braze-${timestamp}`;
    const amplitudeSessionId = `legacy-amp-${timestamp}`;
    const brandId = `legacy-brand-${timestamp}`;
    const customerEmail = `legacy-${timestamp}@example.com`;

    it('should work with legacy identify endpoint (Braze)', async () => {
      const response = await request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          internalSessionId: internalSessionId,
          email: customerEmail,
          provider: 'braze',
          externalSessionId: brazeSessionId,
          brandId: brandId
        })
        .expect(201);

      expect(response.body.customer.internalSessionId).toBe(internalSessionId);
      expect(response.body.session.brazeSession).toBe(brazeSessionId);
      expect(response.body.session.amplitudeSession).toBeUndefined();
    });

    it('should work with legacy identify endpoint (Amplitude)', async () => {
      const response = await request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          internalSessionId: internalSessionId,
          email: customerEmail,
          provider: 'amplitude',
          externalSessionId: amplitudeSessionId,
          brandId: brandId
        })
        .expect(201);

      expect(response.body.customer.internalSessionId).toBe(internalSessionId);
      expect(response.body.session.brazeSession).toBe(brazeSessionId);
      expect(response.body.session.amplitudeSession).toBe(amplitudeSessionId);
    });

    it('should work with legacy link-login endpoint', async () => {
      const response = await request(app.getHttpServer())
        .post('/identity/link-login')
        .send({
          internalSessionId: internalSessionId,
          email: customerEmail,
          provider: 'braze',
          externalSessionId: brazeSessionId,
          brandId: brandId
        })
        .expect(201);

      expect(response.body.customer.internalSessionId).toBe(internalSessionId);
      expect(response.body.session.brazeSession).toBe(brazeSessionId);
    });

    it('should work with legacy customer-for-session endpoint (Braze)', async () => {
      const response = await request(app.getHttpServer())
        .get('/identity/customer-for-session')
        .query({
          provider: 'braze',
          externalSessionId: brazeSessionId
        })
        .expect(200);

      expect(response.body.internalSessionId).toBe(internalSessionId);
      expect(response.body.email).toBe(customerEmail);
    });

    it('should work with legacy customer-for-session endpoint (Amplitude)', async () => {
      const response = await request(app.getHttpServer())
        .get('/identity/customer-for-session')
        .query({
          provider: 'amplitude',
          externalSessionId: amplitudeSessionId
        })
        .expect(200);

      expect(response.body.internalSessionId).toBe(internalSessionId);
      expect(response.body.email).toBe(customerEmail);
    });
  });

  describe('Session Type Combinations', () => {
    const timestamp = Date.now();
    const internalSessionId = `combo-${timestamp}`;
    const brandId = `combo-brand-${timestamp}`;
    const customerEmail = `combo-${timestamp}@example.com`;

    it('should create customer with Braze session only', async () => {
      const brazeSessionId = `combo-braze-${timestamp}`;
      
      const response = await request(app.getHttpServer())
        .post('/identity/customer-session')
        .send({
          internalSessionId: internalSessionId,
          email: customerEmail,
          brazeSession: brazeSessionId,
          brandId: brandId
        })
        .expect(201);

      expect(response.body.session.brazeSession).toBe(brazeSessionId);
      expect(response.body.session.amplitudeSession).toBeUndefined();
    });

    it('should add Amplitude session later', async () => {
      const amplitudeSessionId = `combo-amp-${timestamp}`;
      
      const response = await request(app.getHttpServer())
        .post('/identity/update-customer-session')
        .send({
          internalSessionId: internalSessionId,
          amplitudeSession: amplitudeSessionId
        })
        .expect(201);

      expect(response.body.brazeSession).toBeDefined();
      expect(response.body.amplitudeSession).toBe(amplitudeSessionId);
    });

    it('should find by any session type', async () => {
      // Find by Braze session
      const brazeResponse = await request(app.getHttpServer())
        .get('/identity/find-customer-by-session')
        .query({ brazeSession: `combo-braze-${timestamp}` })
        .expect(200);

      expect(brazeResponse.body.customer.internalSessionId).toBe(internalSessionId);

      // Find by Amplitude session
      const ampResponse = await request(app.getHttpServer())
        .get('/identity/find-customer-by-session')
        .query({ amplitudeSession: `combo-amp-${timestamp}` })
        .expect(200);

      expect(ampResponse.body.customer.internalSessionId).toBe(internalSessionId);

      // Find by internal session ID
      const internalResponse = await request(app.getHttpServer())
        .get('/identity/quick-identify-customer')
        .query({ internalSessionId: internalSessionId })
        .expect(200);

      expect(internalResponse.body.customer.internalSessionId).toBe(internalSessionId);
    });
  });
});
