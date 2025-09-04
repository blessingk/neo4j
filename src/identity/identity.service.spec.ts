import { Test, TestingModule } from '@nestjs/testing';
import { IdentityService } from './identity.service';
import { Neo4jService } from '../common/neo4j/neo4j.service';
import { IdentifyDto, Provider } from './dto/identify.dto';
import { LoginLinkDto } from './dto/login-link.dto';

describe('IdentityService', () => {
  let service: IdentityService;
  let neo4jService: Neo4jService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityService,
        {
          provide: Neo4jService,
          useValue: {
            session: jest.fn().mockReturnValue({
              run: jest.fn(),
              close: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<IdentityService>(IdentityService);
    neo4jService = module.get<Neo4jService>(Neo4jService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('identify', () => {
    it('should create a session', async () => {
      const mockSession = {
        run: jest.fn().mockResolvedValue({
          records: [{ get: () => ({ properties: { id: 'test-id' } }) }],
        }),
        close: jest.fn(),
      };

      jest.spyOn(neo4jService, 'session').mockReturnValue(mockSession as any);

      const dto: IdentifyDto = {
        provider: Provider.AMPLITUDE,
        externalSessionId: 'test-session',
        brandId: 'test-brand',
      };

      const result = await service.identify(dto);

      expect(result).toEqual({ id: 'test-id' });
      expect(mockSession.run).toHaveBeenCalled();
      expect(mockSession.close).toHaveBeenCalled();
    });
  });
});
