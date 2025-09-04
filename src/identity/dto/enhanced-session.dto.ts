import { IsEmail, IsOptional, IsString, IsEnum } from 'class-validator';
import { Provider } from './identify.dto';

// Quick identification by external session (Braze/Amplitude)
export class QuickIdentifyDto {
  @IsEnum(Provider)
  provider: Provider; // 'braze' or 'amplitude'

  @IsString()
  externalSessionId: string;

  @IsOptional()
  @IsString()
  brandId?: string;
}

// Quick identification by internal session (after login)
export class QuickIdentifyInternalDto {
  @IsString()
  internalSessionId: string;
}

// Link external session to customer (first identification)
export class LinkExternalSessionDto {
  @IsEmail()
  email: string;

  @IsEnum(Provider)
  provider: Provider; // 'braze' or 'amplitude'

  @IsString()
  externalSessionId: string;

  @IsOptional()
  @IsString()
  brandId?: string;
}

// Link internal session to customer (after login)
export class LinkInternalSessionDto {
  @IsEmail()
  email: string;

  @IsString()
  internalSessionId: string;

  @IsOptional()
  @IsString()
  brandId?: string;
}

// Get customer with all sessions
export class GetCustomerSessionsDto {
  @IsEmail()
  email: string;
}

// Find customer by any session
export class FindCustomerDto {
  @IsOptional()
  @IsEnum(Provider)
  provider?: Provider;

  @IsOptional()
  @IsString()
  externalSessionId?: string;

  @IsOptional()
  @IsString()
  internalSessionId?: string;
}
