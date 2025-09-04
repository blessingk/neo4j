import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum Provider { 
  BRAZE = 'braze', 
  AMPLITUDE = 'amplitude', 
  INTERNAL = 'internal' 
}

export class IdentifyDto {
  @IsEnum(Provider) 
  provider: Provider;           // braze | amplitude

  @IsString() 
  externalSessionId: string;          // e.g. braze session id

  @IsString() 
  brandId: string;                    // our known brand id

  @IsOptional() 
  @IsString() 
  deviceFingerprint?: string;

  @IsOptional() 
  @IsString() 
  ip?: string;

  @IsOptional() 
  @IsString() 
  userAgent?: string;

  @IsOptional() 
  @IsString() 
  internalSessionId?: string; // if you also generate your own
}
