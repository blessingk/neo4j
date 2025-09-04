import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Driver, Session } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleDestroy {
  constructor(@Inject('NEO4J_DRIVER') private readonly driver: Driver) {}

  session(): Session {
    try {
      return this.driver.session();
    } catch (error) {
      console.error('Failed to create Neo4j session:', error.message);
      throw new Error('Neo4j connection not available');
    }
  }

  async onModuleDestroy() {
    try {
      await this.driver.close();
    } catch (error) {
      console.warn('Error closing Neo4j driver:', error.message);
    }
  }
}
