import { validate } from 'class-validator';
import { IdentifyDto, Provider } from './identify.dto';
import { LoginLinkDto } from './login-link.dto';
import { UpsertBrandDto } from './upsert-brand.dto';

describe('DTO Validation', () => {
  describe('IdentifyDto', () => {
    it('should validate a valid identify dto', async () => {
      const dto = new IdentifyDto();
      dto.provider = Provider.AMPLITUDE;
      dto.externalSessionId = 'amp_sess_123';
      dto.brandId = 'brand-1';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid provider', async () => {
      const dto = new IdentifyDto();
      dto.provider = 'invalid' as Provider;
      dto.externalSessionId = 'amp_sess_123';
      dto.brandId = 'brand-1';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isEnum).toBeDefined();
    });

    it('should fail validation with missing required fields', async () => {
      const dto = new IdentifyDto();
      dto.provider = Provider.AMPLITUDE;
      // Missing externalSessionId (brandId is now optional)

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors.some(e => e.property === 'externalSessionId')).toBe(true);
    });

    it('should validate optional fields', async () => {
      const dto = new IdentifyDto();
      dto.provider = Provider.AMPLITUDE;
      dto.externalSessionId = 'amp_sess_123';
      dto.brandId = 'brand-1';
      dto.deviceFingerprint = 'fingerprint-123';
      dto.ip = '192.168.1.1';
      dto.userAgent = 'Mozilla/5.0';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('LoginLinkDto', () => {
    it('should validate a valid login link dto with email', async () => {
      const dto = new LoginLinkDto();
      dto.provider = Provider.AMPLITUDE;
      dto.externalSessionId = 'amp_sess_123';
      dto.brandId = 'brand-1';
      dto.email = 'test@example.com';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate a valid login link dto with phone', async () => {
      const dto = new LoginLinkDto();
      dto.provider = Provider.AMPLITUDE;
      dto.externalSessionId = 'amp_sess_123';
      dto.brandId = 'brand-1';
      dto.phone = '+1234567890';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid email', async () => {
      const dto = new LoginLinkDto();
      dto.provider = Provider.AMPLITUDE;
      dto.externalSessionId = 'amp_sess_123';
      dto.brandId = 'brand-1';
      dto.email = 'invalid-email';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isEmail).toBeDefined();
    });

    it('should fail validation with missing required fields', async () => {
      const dto = new LoginLinkDto();
      dto.provider = Provider.AMPLITUDE;
      // Missing externalSessionId (brandId is now optional)

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors.some(e => e.property === 'externalSessionId')).toBe(true);
    });
  });

  describe('UpsertBrandDto', () => {
    it('should validate a valid brand dto', async () => {
      const dto = new UpsertBrandDto();
      dto.id = 'brand-1';
      dto.name = 'Test Brand';
      dto.slug = 'test-brand';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with missing required fields', async () => {
      const dto = new UpsertBrandDto();
      dto.id = 'brand-1';
      // Missing name and slug

      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
      expect(errors.some(e => e.property === 'name')).toBe(true);
      expect(errors.some(e => e.property === 'slug')).toBe(true);
    });

    it('should fail validation with empty strings', async () => {
      const dto = new UpsertBrandDto();
      dto.id = '';
      dto.name = '';
      dto.slug = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(3);
    });
  });
});
