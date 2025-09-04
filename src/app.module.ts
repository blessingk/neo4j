import { Module } from '@nestjs/common';
import { IdentityModule } from './identity/identity.module';
import { Neo4jModule } from './common/neo4j/neo4j.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [Neo4jModule, IdentityModule, HealthModule],
})
export class AppModule {}
