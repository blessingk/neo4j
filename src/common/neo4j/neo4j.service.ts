import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Driver, Session } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleDestroy {
  constructor(@Inject('NEO4J_DRIVER') private readonly driver: Driver) {}

  session(): Session {
    return this.driver.session();
  }

  async onModuleDestroy() {
    await this.driver.close();
  }
}
