import { Module } from '@nestjs/common';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { Neo4jModule } from '../common/neo4j/neo4j.module';

@Module({
  imports: [Neo4jModule],
  controllers: [IdentityController],
  providers: [IdentityService],
})
export class IdentityModule {}
