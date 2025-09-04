import { Module, Global } from '@nestjs/common';
import neo4j, { Driver } from 'neo4j-driver';

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
  ],
  exports: ['NEO4J_DRIVER'],
})
export class Neo4jModule {}
