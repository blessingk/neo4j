import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

export class TestHelper {
  static async createTestingApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app.init();
    return app;
  }

  static generateTestData() {
    return {
      brand: {
        id: `test-brand-${Date.now()}`,
        name: 'Test Brand',
        slug: 'test-brand',
      },
      session: {
        provider: 'amplitude' as const,
        externalSessionId: `test-session-${Date.now()}`,
        brandId: `test-brand-${Date.now()}`,
      },
      customer: {
        email: `test-${Date.now()}@example.com`,
        phone: `+1${Date.now()}`,
      },
    };
  }

  static async cleanupTestData(app: INestApplication, testData: any) {
    // This would typically clean up test data from the database
    // For now, we'll just close the app
    await app.close();
  }
}
