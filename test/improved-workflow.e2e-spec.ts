import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Improved Customer Identity Workflow E2E Tests', () => {
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

  describe('Quick Identification by External Sessions', () => {
    it('should quickly identify customer by Braze session', async () => {
      const brandId = `quick-braze-brand-${Date.now()}`;
      const brazeSessionId = `braze_quick_${Date.now()}`;
      const customerEmail = `quick-braze-${Date.now()}@example.com`;

      // Setup: Create brand and session
      await request(app.getHttpServer())
        .post('/identity/brand')
        .send({
          id: brandId,
          name: 'Quick Braze Brand',
          slug: 'quick-braze-brand',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          provider: 'braze',
          externalSessionId: brazeSessionId,
          brandId,
        })
        .expect(201);

      // Link session to customer
      await request(app.getHttpServer())
        .post('/identity/link-external-session')
        .send({
          email: customerEmail,
          provider: 'braze',
          externalSessionId: brazeSessionId,
          brandId,
        })
        .expect(201);

      // Quick identification should find the customer
      const quickIdentifyResponse = await request(app.getHttpServer())
        .get('/identity/quick-identify-external')
        .query({
          provider: 'braze',
          externalSessionId: brazeSessionId,
          brandId,
        })
        .expect(200);

      expect(quickIdentifyResponse.body.session).toBeDefined();
      expect(quickIdentifyResponse.body.customer.email).toBe(customerEmail);
    });

    it('should quickly identify customer by Amplitude session', async () => {
      const brandId = `quick-amp-brand-${Date.now()}`;
      const amplitudeSessionId = `amp_quick_${Date.now()}`;
      const customerEmail = `quick-amp-${Date.now()}@example.com`;

      // Setup: Create brand and session
      await request(app.getHttpServer())
        .post('/identity/brand')
        .send({
          id: brandId,
          name: 'Quick Amplitude Brand',
          slug: 'quick-amplitude-brand',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          provider: 'amplitude',
          externalSessionId: amplitudeSessionId,
          brandId,
        })
        .expect(201);

      // Link session to customer
      await request(app.getHttpServer())
        .post('/identity/link-external-session')
        .send({
          email: customerEmail,
          provider: 'amplitude',
          externalSessionId: amplitudeSessionId,
          brandId,
        })
        .expect(201);

      // Quick identification should find the customer
      const quickIdentifyResponse = await request(app.getHttpServer())
        .get('/identity/quick-identify-external')
        .query({
          provider: 'amplitude',
          externalSessionId: amplitudeSessionId,
          brandId,
        })
        .expect(200);

      expect(quickIdentifyResponse.body.session).toBeDefined();
      expect(quickIdentifyResponse.body.customer.email).toBe(customerEmail);
    });

    it('should return null for unknown external sessions', async () => {
      const quickIdentifyResponse = await request(app.getHttpServer())
        .get('/identity/quick-identify-external')
        .query({
          provider: 'braze',
          externalSessionId: 'unknown_session',
          brandId: 'unknown-brand',
        })
        .expect(200);

      expect(quickIdentifyResponse.body.session).toBeNull();
      expect(quickIdentifyResponse.body.customer).toBeNull();
    });
  });

  describe('Internal Session Workflow', () => {
    it('should link internal session to customer after login', async () => {
      const brandId = `internal-workflow-brand-${Date.now()}`;
      const internalSessionId = `internal_workflow_${Date.now()}`;
      const customerEmail = `internal-workflow-${Date.now()}@example.com`;

      // Setup: Create brand and internal session
      await request(app.getHttpServer())
        .post('/identity/brand')
        .send({
          id: brandId,
          name: 'Internal Workflow Brand',
          slug: 'internal-workflow-brand',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/identity/internal-session')
        .send({
          internalSessionId,
          brandId,
        })
        .expect(201);

      // Link internal session to customer (after login)
      const linkResponse = await request(app.getHttpServer())
        .post('/identity/link-internal-session')
        .send({
          email: customerEmail,
          internalSessionId,
          brandId,
        })
        .expect(201);

      expect(linkResponse.body.email).toBe(customerEmail);

      // Quick identification by internal session should find the customer
      const quickIdentifyResponse = await request(app.getHttpServer())
        .get('/identity/quick-identify-internal')
        .query({
          internalSessionId,
        })
        .expect(200);

      expect(quickIdentifyResponse.body.session).toBeDefined();
      expect(quickIdentifyResponse.body.customer.email).toBe(customerEmail);
    });

    it('should return null for unlinked internal sessions', async () => {
      const brandId = `unlinked-internal-brand-${Date.now()}`;
      const internalSessionId = `internal_unlinked_${Date.now()}`;

      // Setup: Create brand and internal session
      await request(app.getHttpServer())
        .post('/identity/brand')
        .send({
          id: brandId,
          name: 'Unlinked Internal Brand',
          slug: 'unlinked-internal-brand',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/identity/internal-session')
        .send({
          internalSessionId,
          brandId,
        })
        .expect(201);

      // Quick identification should return null for unlinked session
      const quickIdentifyResponse = await request(app.getHttpServer())
        .get('/identity/quick-identify-internal')
        .query({
          internalSessionId,
        })
        .expect(200);

      expect(quickIdentifyResponse.body.session).toBeDefined();
      expect(quickIdentifyResponse.body.customer).toBeNull();
    });
  });

  describe('Session Stitching Workflow', () => {
    it('should stitch internal session to existing external sessions', async () => {
      const brandId = `stitch-workflow-brand-${Date.now()}`;
      const brazeSessionId = `braze_stitch_${Date.now()}`;
      const amplitudeSessionId = `amp_stitch_${Date.now()}`;
      const internalSessionId = `internal_stitch_${Date.now()}`;
      const customerEmail = `stitch-workflow-${Date.now()}@example.com`;

      // Setup: Create brand and sessions
      await request(app.getHttpServer())
        .post('/identity/brand')
        .send({
          id: brandId,
          name: 'Stitch Workflow Brand',
          slug: 'stitch-workflow-brand',
        })
        .expect(201);

      // Create external sessions
      await request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          provider: 'braze',
          externalSessionId: brazeSessionId,
          brandId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          provider: 'amplitude',
          externalSessionId: amplitudeSessionId,
          brandId,
        })
        .expect(201);

      // Create internal session
      await request(app.getHttpServer())
        .post('/identity/internal-session')
        .send({
          internalSessionId,
          brandId,
        })
        .expect(201);

      // Link external sessions to customer
      await request(app.getHttpServer())
        .post('/identity/link-external-session')
        .send({
          email: customerEmail,
          provider: 'braze',
          externalSessionId: brazeSessionId,
          brandId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/identity/link-external-session')
        .send({
          email: customerEmail,
          provider: 'amplitude',
          externalSessionId: amplitudeSessionId,
          brandId,
        })
        .expect(201);

      // Stitch internal session to existing external sessions
      const stitchResponse = await request(app.getHttpServer())
        .post('/identity/link-internal-to-existing')
        .send({
          email: customerEmail,
          internalSessionId,
          brandId,
        })
        .expect(201);

      expect(stitchResponse.body.email).toBe(customerEmail);

      // Verify all sessions are linked to the same customer
      const customerWithSessions = await request(app.getHttpServer())
        .get('/identity/customer-with-sessions')
        .query({ email: customerEmail })
        .expect(200);

      expect(customerWithSessions.body.customer.email).toBe(customerEmail);
      expect(customerWithSessions.body.sessions).toHaveLength(3);

      // Verify customer can be found by any session type
      const findByBraze = await request(app.getHttpServer())
        .get('/identity/find-customer')
        .query({
          provider: 'braze',
          externalSessionId: brazeSessionId,
        })
        .expect(200);

      const findByAmplitude = await request(app.getHttpServer())
        .get('/identity/find-customer')
        .query({
          provider: 'amplitude',
          externalSessionId: amplitudeSessionId,
        })
        .expect(200);

      const findByInternal = await request(app.getHttpServer())
        .get('/identity/find-customer')
        .query({
          internalSessionId,
        })
        .expect(200);

      expect(findByBraze.body.email).toBe(customerEmail);
      expect(findByAmplitude.body.email).toBe(customerEmail);
      expect(findByInternal.body.email).toBe(customerEmail);
      expect(findByBraze.body.id).toBe(findByAmplitude.body.id);
      expect(findByAmplitude.body.id).toBe(findByInternal.body.id);
    });
  });

  describe('Customer Lookup by Any Session', () => {
    it('should find customer regardless of session type used', async () => {
      const brandId = `lookup-any-brand-${Date.now()}`;
      const brazeSessionId = `braze_lookup_${Date.now()}`;
      const amplitudeSessionId = `amp_lookup_${Date.now()}`;
      const internalSessionId = `internal_lookup_${Date.now()}`;
      const customerEmail = `lookup-any-${Date.now()}@example.com`;

      // Setup: Create brand and sessions
      await request(app.getHttpServer())
        .post('/identity/brand')
        .send({
          id: brandId,
          name: 'Lookup Any Brand',
          slug: 'lookup-any-brand',
        })
        .expect(201);

      // Create sessions
      await request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          provider: 'braze',
          externalSessionId: brazeSessionId,
          brandId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          provider: 'amplitude',
          externalSessionId: amplitudeSessionId,
          brandId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/identity/internal-session')
        .send({
          internalSessionId,
          brandId,
        })
        .expect(201);

      // Link all sessions to customer
      await request(app.getHttpServer())
        .post('/identity/link-external-session')
        .send({
          email: customerEmail,
          provider: 'braze',
          externalSessionId: brazeSessionId,
          brandId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/identity/link-external-session')
        .send({
          email: customerEmail,
          provider: 'amplitude',
          externalSessionId: amplitudeSessionId,
          brandId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/identity/link-internal-session')
        .send({
          email: customerEmail,
          internalSessionId,
          brandId,
        })
        .expect(201);

      // Test lookup by each session type
      const lookups = [
        { provider: 'braze', externalSessionId: brazeSessionId },
        { provider: 'amplitude', externalSessionId: amplitudeSessionId },
        { internalSessionId },
      ];

      for (const lookup of lookups) {
        const response = await request(app.getHttpServer())
          .get('/identity/find-customer')
          .query(lookup)
          .expect(200);

        expect(response.body.email).toBe(customerEmail);
      }
    });
  });

  describe('Latest Session Tracking', () => {
    it('should track customer\'s latest session', async () => {
      const brandId = `latest-session-brand-${Date.now()}`;
      const brazeSessionId = `braze_latest_${Date.now()}`;
      const internalSessionId = `internal_latest_${Date.now()}`;
      const customerEmail = `latest-session-${Date.now()}@example.com`;

      // Setup: Create brand and sessions
      await request(app.getHttpServer())
        .post('/identity/brand')
        .send({
          id: brandId,
          name: 'Latest Session Brand',
          slug: 'latest-session-brand',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/identity/identify')
        .send({
          provider: 'braze',
          externalSessionId: brazeSessionId,
          brandId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/identity/internal-session')
        .send({
          internalSessionId,
          brandId,
        })
        .expect(201);

      // Link sessions to customer
      await request(app.getHttpServer())
        .post('/identity/link-external-session')
        .send({
          email: customerEmail,
          provider: 'braze',
          externalSessionId: brazeSessionId,
          brandId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/identity/link-internal-session')
        .send({
          email: customerEmail,
          internalSessionId,
          brandId,
        })
        .expect(201);

      // Get latest session
      const latestSessionResponse = await request(app.getHttpServer())
        .get('/identity/customer-latest-session')
        .query({ email: customerEmail })
        .expect(200);

      expect(latestSessionResponse.body.provider).toBe('internal');
      expect(latestSessionResponse.body.externalId).toBe(internalSessionId);
    });
  });
});
