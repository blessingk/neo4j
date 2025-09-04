import { Module } from '@nestjs/common';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { Neo4jModule } from '../common/neo4j/neo4j.module';
import { Neo4jService } from '../common/neo4j/neo4j.service';

@Module({
  imports: [Neo4jModule],
  controllers: [IdentityController],
  providers: [IdentityService, Neo4jService],
})
export class IdentityModule {}
