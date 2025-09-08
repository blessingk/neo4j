import { Module, Global } from '@nestjs/common';
import neo4j, { Driver } from 'neo4j-driver';
import { Neo4jOGMService } from './neo4j-ogm.service';
  import { BrandRepository, SessionRepository } from './repositories';

@Global()
@Module({
  providers: [
    {
      provide: 'NEO4J_DRIVER',
      useFactory: async (): Promise<Driver> => {
        const driver = neo4j.driver(
          process.env.NEO4J_URI!,
          neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
        );
        
        // Try to verify connectivity, but don't fail if it's not available
        try {
          await driver.verifyConnectivity();
          console.log('✅ Connected to Neo4j successfully');
        } catch (error) {
          console.warn('⚠️  Neo4j connection failed, but continuing startup:', error.message);
        }
        
        return driver;
      },
    },
    {
      provide: 'NEO4J_OGM',
      useFactory: async (): Promise<Neo4jOGMService> => {
        const ogmService = new Neo4jOGMService();
        await ogmService.initialize();
        return ogmService;
      },
    },
    BrandRepository,
    SessionRepository,
  ],
  exports: ['NEO4J_DRIVER', 'NEO4J_OGM', BrandRepository, SessionRepository],
})
export class Neo4jModule {}
