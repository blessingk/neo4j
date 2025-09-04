import { IsEmail, IsOptional, IsString, IsEnum } from 'class-validator';
import { Provider } from './identify.dto';

export class LoginLinkDto {
  @IsOptional()
  @IsString() 
  brandId?: string;

  @IsEnum(Provider) 
  provider: Provider;

  @IsString() 
  externalSessionId: string; // the same session we saw before

  @IsOptional() 
  @IsString() 
  customerId?: string;  // if you already have one

  @IsOptional() 
  @IsEmail() 
  email?: string;

  @IsOptional() 
  @IsString() 
  phone?: string;

  @IsOptional() 
  @IsString() 
  name?: string;

  @IsOptional()
  @IsString()
  internalSessionId?: string;  // our internal session ID (primary identifier)
}
