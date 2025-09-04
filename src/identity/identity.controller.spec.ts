import { Test, TestingModule } from '@nestjs/testing';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { IdentifyDto, Provider } from './dto/identify.dto';
import { LoginLinkDto } from './dto/login-link.dto';
import { UpsertBrandDto } from './dto/upsert-brand.dto';

describe('IdentityController', () => {
  let controller: IdentityController;
  let service: IdentityService;

  const mockIdentityService = {
  upsertBrand: jest.fn(),
  identify: jest.fn(),
  linkOnLogin: jest.fn(),
  findCustomerBySession: jest.fn(),
  createOrUpdateCustomerSession: jest.fn(),
  quickIdentifyCustomer: jest.fn(),
  updateCustomerSession: jest.fn(),
  getCustomerSession: jest.fn(),
  getAllCustomersWithSessions: jest.fn(),
  getCustomerLoyaltyProfile: jest.fn(),
};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IdentityController],
      providers: [
        {
          provide: IdentityService,
          useValue: mockIdentityService,
        },
      ],
    }).compile();

    controller = module.get<IdentityController>(IdentityController);
    service = module.get<IdentityService>(IdentityService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('upsertBrand', () => {
    it('should create a brand successfully', async () => {
      const dto: UpsertBrandDto = {
        id: 'brand-1',
        name: 'Test Brand',
        slug: 'test-brand',
      };
      const expectedResult = { id: 'brand-1', name: 'Test Brand', slug: 'test-brand' };
      mockIdentityService.upsertBrand.mockResolvedValue(expectedResult);

      const result = await controller.upsertBrand(dto);

      expect(result).toEqual(expectedResult);
      expect(mockIdentityService.upsertBrand).toHaveBeenCalledWith('brand-1', 'Test Brand', 'test-brand');
    });
  });

  describe('identify', () => {
    it('should identify a session successfully', async () => {
      const dto: IdentifyDto = {
        provider: Provider.AMPLITUDE,
        externalSessionId: 'amp_sess_123',
        brandId: 'brand-1',
      };
      const expectedResult = { id: 'session-1', provider: 'amplitude', externalId: 'amp_sess_123' };
      mockIdentityService.identify.mockResolvedValue(expectedResult);

      const result = await controller.identify(dto);

      expect(result).toEqual(expectedResult);
      expect(mockIdentityService.identify).toHaveBeenCalledWith(dto);
    });
  });

  describe('link', () => {
    it('should link session to customer successfully', async () => {
      const dto: LoginLinkDto = {
        provider: Provider.AMPLITUDE,
        externalSessionId: 'amp_sess_123',
        brandId: 'brand-1',
        email: 'test@example.com',
      };
      const expectedResult = { id: 'customer-1', email: 'test@example.com' };
      mockIdentityService.linkOnLogin.mockResolvedValue(expectedResult);

      const result = await controller.link(dto);

      expect(result).toEqual(expectedResult);
      expect(mockIdentityService.linkOnLogin).toHaveBeenCalledWith(dto);
    });
  });

  describe('getCustomer', () => {
    it('should return customer for session', async () => {
      const provider = 'braze';
      const externalSessionId = 'braze_sess_123';
      const expectedResult = { id: 'customer-1', email: 'test@example.com' };
      mockIdentityService.findCustomerBySession.mockResolvedValue({
        customer: expectedResult,
        session: { id: 'session-1' },
        brand: { id: 'brand-1' }
      });

      const result = await controller.getCustomer(provider as any, externalSessionId);

      expect(result).toEqual(expectedResult);
      expect(mockIdentityService.findCustomerBySession).toHaveBeenCalledWith({
        brazeSession: 'braze_sess_123',
        amplitudeSession: null
      });
    });

    it('should return null when customer not found', async () => {
      const provider = 'braze';
      const externalSessionId = 'braze_sess_123';
      mockIdentityService.findCustomerBySession.mockResolvedValue(null);

      const result = await controller.getCustomer(provider as any, externalSessionId);

      expect(result).toBeNull();
      expect(mockIdentityService.findCustomerBySession).toHaveBeenCalledWith({
        brazeSession: 'braze_sess_123',
        amplitudeSession: null
      });
    });
  });
});
