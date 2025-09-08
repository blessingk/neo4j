import { Test, TestingModule } from '@nestjs/testing';
import { IdentityService } from './identity.service';
import { BrandRepository } from '../common/neo4j/repositories/brand.repository';
import { SessionRepository } from '../common/neo4j/repositories/session.repository';
import { IdentifyDto, Provider } from './dto/identify.dto';
import { LoginLinkDto } from './dto/login-link.dto';
import { 
  mockBrandData, 
  mockCustomerData, 
  mockSessionData, 
  mockCustomerSessionResult,
  mockBrandRepository,
  mockSessionRepository
} from '../common/test/mock-data';

describe('IdentityService', () => {
  let service: IdentityService;
  let brandRepository: BrandRepository;
  let sessionRepository: SessionRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityService,
        {
          provide: BrandRepository,
          useValue: mockBrandRepository,
        },
        {
          provide: SessionRepository,
          useValue: mockSessionRepository,
        },
      ],
    }).compile();

    service = module.get<IdentityService>(IdentityService);
    brandRepository = module.get<BrandRepository>(BrandRepository);
    sessionRepository = module.get<SessionRepository>(SessionRepository);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsertBrand', () => {
    it('should create a brand successfully', async () => {
      mockBrandRepository.upsertBrand.mockResolvedValue(mockBrandData);

      const result = await service.upsertBrand('brand-1', 'Test Brand', 'test-brand');

      expect(result).toEqual(mockBrandData);
      expect(mockBrandRepository.upsertBrand).toHaveBeenCalledWith('brand-1', 'Test Brand', 'test-brand');
    });

    it('should handle database errors gracefully', async () => {
      mockBrandRepository.upsertBrand.mockRejectedValue(new Error('Database error'));

      await expect(service.upsertBrand('brand-1', 'Test Brand', 'test-brand')).rejects.toThrow('Database operation failed');
    });
  });

  describe('identify', () => {
    it('should create a session successfully', async () => {
      const dto: IdentifyDto = {
        provider: Provider.AMPLITUDE,
        externalSessionId: 'amp_sess_123',
        brandId: 'brand-1',
      };

      mockSessionRepository.createOrUpdateCustomerSession.mockResolvedValue(mockCustomerSessionResult);

      const result = await service.identify(dto);

      expect(result).toEqual({
        internalSessionId: 'amplitude_amp_sess_123_brand-1',
        customer: mockCustomerData,
        session: mockSessionData,
      });
      expect(mockSessionRepository.createOrUpdateCustomerSession).toHaveBeenCalledWith({
        internalSessionId: 'amplitude_amp_sess_123_brand-1',
        brazeSession: undefined,
        amplitudeSession: 'amp_sess_123',
        brandId: 'brand-1',
      });
    });

    it('should handle database errors gracefully', async () => {
      const dto: IdentifyDto = {
        provider: Provider.AMPLITUDE,
        externalSessionId: 'amp_sess_123',
        brandId: 'brand-1',
      };

      mockSessionRepository.createOrUpdateCustomerSession.mockRejectedValue(new Error('Database error'));

      await expect(service.identify(dto)).rejects.toThrow('Database operation failed');
    });
  });

  describe('linkOnLogin', () => {
    it('should link session to customer by email successfully', async () => {
      const dto: LoginLinkDto = {
        provider: Provider.AMPLITUDE,
        externalSessionId: 'amp_sess_123',
        email: 'test@example.com',
        brandId: 'brand-1',
      };

      mockSessionRepository.createOrUpdateCustomerSession.mockResolvedValue(mockCustomerSessionResult);

      const result = await service.linkOnLogin(dto);

      expect(result).toEqual({
        internalSessionId: 'amplitude_amp_sess_123_brand-1',
        customer: mockCustomerData,
        session: mockSessionData,
      });
      expect(mockSessionRepository.createOrUpdateCustomerSession).toHaveBeenCalledWith({
        internalSessionId: 'amplitude_amp_sess_123_brand-1',
        email: 'test@example.com',
        brazeSession: undefined,
        amplitudeSession: 'amp_sess_123',
        brandId: 'brand-1',
      });
    });

    it('should handle database errors gracefully', async () => {
      const dto: LoginLinkDto = {
        provider: Provider.AMPLITUDE,
        externalSessionId: 'amp_sess_123',
        email: 'test@example.com',
        brandId: 'brand-1',
      };

      mockSessionRepository.createOrUpdateCustomerSession.mockRejectedValue(new Error('Database error'));

      await expect(service.linkOnLogin(dto)).rejects.toThrow('Database operation failed');
    });
  });

  describe('findCustomerBySession', () => {
    it('should return customer when found by braze session', async () => {
      mockSessionRepository.findCustomerBySession.mockResolvedValue({
        session: mockSessionData,
        customer: mockCustomerData,
        brand: mockBrandData,
      });

      const result = await service.findCustomerBySession({
        brazeSession: 'braze_123',
      });

      expect(result).toEqual({
        session: mockSessionData,
        customer: mockCustomerData,
        brand: mockBrandData,
      });
      expect(mockSessionRepository.findCustomerBySession).toHaveBeenCalledWith({
        brazeSession: 'braze_123',
        amplitudeSession: undefined,
        internalSessionId: undefined,
        email: undefined,
      });
    });

    it('should return null when customer not found', async () => {
      mockSessionRepository.findCustomerBySession.mockResolvedValue({
        session: null,
        customer: null,
        brand: null,
      });

      const result = await service.findCustomerBySession({
        brazeSession: 'nonexistent',
      });

      expect(result).toEqual({
        session: null,
        customer: null,
        brand: null,
      });
    });

    it('should handle database errors gracefully', async () => {
      mockSessionRepository.findCustomerBySession.mockRejectedValue(new Error('Database error'));

      await expect(service.findCustomerBySession({ brazeSession: 'braze_123' })).rejects.toThrow('Database operation failed');
    });
  });
});