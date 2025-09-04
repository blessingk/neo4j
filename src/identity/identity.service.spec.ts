import { Test, TestingModule } from '@nestjs/testing';
import { IdentityService } from './identity.service';
import { Neo4jService } from '../common/neo4j/neo4j.service';
import { IdentifyDto, Provider } from './dto/identify.dto';
import { LoginLinkDto } from './dto/login-link.dto';

describe('IdentityService', () => {
  let service: IdentityService;
  let neo4jService: Neo4jService;

  const mockSession = {
    run: jest.fn(),
    close: jest.fn(),
  };

  const mockNeo4jService = {
    session: jest.fn().mockReturnValue(mockSession),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityService,
        {
          provide: Neo4jService,
          useValue: mockNeo4jService,
        },
      ],
    }).compile();

    service = module.get<IdentityService>(IdentityService);
    neo4jService = module.get<Neo4jService>(Neo4jService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsertBrand', () => {
    it('should create a brand successfully', async () => {
      const mockResult = {
        records: [{ get: () => ({ properties: { id: 'brand-1', name: 'Test Brand', slug: 'test-brand' } }) }],
      };
      mockSession.run.mockResolvedValue(mockResult);

      const result = await service.upsertBrand('brand-1', 'Test Brand', 'test-brand');

      expect(result).toEqual({ id: 'brand-1', name: 'Test Brand', slug: 'test-brand' });
      expect(mockSession.run).toHaveBeenCalledWith(expect.any(String), {
        brandId: 'brand-1',
        name: 'Test Brand',
        slug: 'test-brand',
      });
      expect(mockSession.close).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockSession.run.mockRejectedValue(new Error('Database error'));

      await expect(service.upsertBrand('brand-1', 'Test Brand', 'test-brand')).rejects.toThrow('Database operation failed');
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('identify', () => {
    it('should create a session successfully', async () => {
      const mockResult = {
        records: [{ get: () => ({ properties: { id: 'session-1', provider: 'amplitude', externalId: 'amp_sess_123' } }) }],
      };
      mockSession.run.mockResolvedValue(mockResult);

      const dto: IdentifyDto = {
        provider: Provider.AMPLITUDE,
        externalSessionId: 'amp_sess_123',
        brandId: 'brand-1',
      };

      const result = await service.identify(dto);

      expect(result).toEqual({ id: 'session-1', provider: 'amplitude', externalId: 'amp_sess_123' });
      expect(mockSession.run).toHaveBeenCalledWith(expect.any(String), {
        brandId: 'brand-1',
        provider: 'amplitude',
        externalSessionId: 'amp_sess_123',
      });
      expect(mockSession.close).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockSession.run.mockRejectedValue(new Error('Database error'));

      const dto: IdentifyDto = {
        provider: Provider.AMPLITUDE,
        externalSessionId: 'amp_sess_123',
        brandId: 'brand-1',
      };

      await expect(service.identify(dto)).rejects.toThrow('Database operation failed');
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('linkOnLogin', () => {
    it('should link session to customer by email successfully', async () => {
      const mockResult = {
        records: [{ get: () => ({ properties: { id: 'customer-1', email: 'test@example.com' } }) }],
      };
      mockSession.run.mockResolvedValue(mockResult);

      const dto: LoginLinkDto = {
        provider: Provider.AMPLITUDE,
        externalSessionId: 'amp_sess_123',
        brandId: 'brand-1',
        email: 'test@example.com',
      };

      const result = await service.linkOnLogin(dto);

      expect(result).toEqual({ id: 'customer-1', email: 'test@example.com' });
      expect(mockSession.run).toHaveBeenCalledWith(expect.any(String), {
        email: 'test@example.com',
        provider: 'amplitude',
        externalSessionId: 'amp_sess_123',
      });
      expect(mockSession.close).toHaveBeenCalled();
    });

    it('should throw error when no linking attribute provided', async () => {
      const dto: LoginLinkDto = {
        provider: Provider.AMPLITUDE,
        externalSessionId: 'amp_sess_123',
        brandId: 'brand-1',
      };

      await expect(service.linkOnLogin(dto)).rejects.toThrow('No linking attribute provided (email/phone/identity).');
      // Session should not be created when no linking attribute is provided
      expect(mockSession.close).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockSession.run.mockRejectedValue(new Error('Database error'));

      const dto: LoginLinkDto = {
        provider: Provider.AMPLITUDE,
        externalSessionId: 'amp_sess_123',
        brandId: 'brand-1',
        email: 'test@example.com',
      };

      await expect(service.linkOnLogin(dto)).rejects.toThrow('Database operation failed');
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('getCustomerForSession', () => {
    it('should return customer when found', async () => {
      const mockResult = {
        records: [{ get: () => ({ properties: { id: 'customer-1', email: 'test@example.com' } }) }],
      };
      mockSession.run.mockResolvedValue(mockResult);

      const result = await service.getCustomerForSession(Provider.AMPLITUDE, 'amp_sess_123');

      expect(result).toEqual({ id: 'customer-1', email: 'test@example.com' });
      expect(mockSession.run).toHaveBeenCalledWith(expect.any(String), {
        provider: 'amplitude',
        externalSessionId: 'amp_sess_123',
      });
      expect(mockSession.close).toHaveBeenCalled();
    });

    it('should return null when customer not found', async () => {
      const mockResult = {
        records: [],
      };
      mockSession.run.mockResolvedValue(mockResult);

      const result = await service.getCustomerForSession(Provider.AMPLITUDE, 'amp_sess_123');

      expect(result).toBeNull();
      expect(mockSession.close).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockSession.run.mockRejectedValue(new Error('Database error'));

      await expect(service.getCustomerForSession(Provider.AMPLITUDE, 'amp_sess_123')).rejects.toThrow('Database operation failed');
      expect(mockSession.close).toHaveBeenCalled();
    });
  });
});
