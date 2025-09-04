import { Test, TestingModule } from '@nestjs/testing';
import { Neo4jService } from './neo4j.service';

describe('Neo4jService', () => {
  let service: Neo4jService;
  let mockDriver: any;

  beforeEach(async () => {
    const mockSession = {
      run: jest.fn(),
      close: jest.fn(),
    };

    mockDriver = {
      session: jest.fn().mockReturnValue(mockSession),
      close: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Neo4jService,
        {
          provide: 'NEO4J_DRIVER',
          useValue: mockDriver,
        },
      ],
    }).compile();

    service = module.get<Neo4jService>(Neo4jService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('session', () => {
    it('should return a session successfully', () => {
      const session = service.session();
      expect(session).toBeDefined();
      expect(mockDriver.session).toHaveBeenCalled();
    });

    it('should handle driver errors gracefully', () => {
      mockDriver.session.mockImplementation(() => {
        throw new Error('Driver error');
      });

      expect(() => service.session()).toThrow('Neo4j connection not available');
    });
  });

  describe('onModuleDestroy', () => {
    it('should close the driver successfully', async () => {
      await service.onModuleDestroy();
      expect(mockDriver.close).toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      mockDriver.close.mockRejectedValue(new Error('Close error'));
      
      // Should not throw
      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });
});
