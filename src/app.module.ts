import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IdentityModule } from './identity/identity.module';
import { Neo4jModule } from './common/neo4j/neo4j.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    Neo4jModule, 
    IdentityModule, 
    HealthModule
  ],
})
export class AppModule {}
