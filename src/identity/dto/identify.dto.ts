import { IsEnum, IsOptional, IsString, IsEmail } from 'class-validator';

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

  @IsOptional()
  @IsString() 
  brandId?: string;                    // our known brand id (optional for unified identity)

  @IsOptional()
  @IsEmail()
  email?: string;                      // customer email for session creation

  @IsOptional()
  @IsString()
  internalSessionId?: string;           // our internal session ID (primary identifier)

  @IsOptional() 
  @IsString() 
  deviceFingerprint?: string;

  @IsOptional() 
  @IsString() 
  ip?: string;

  @IsOptional() 
  @IsString() 
  userAgent?: string;
}
