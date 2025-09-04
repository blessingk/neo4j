import { IsEmail, IsOptional, IsString, IsEnum } from 'class-validator';
import { Provider } from './identify.dto';

// Create or update customer's single session using internal session ID
export class CustomerSessionDto {
  @IsString()
  internalSessionId: string;        // Required: our internal session ID (primary identifier)

  @IsOptional()
  @IsEmail()
  email?: string;                   // Optional: customer email (can change)

  @IsOptional()
  @IsString()
  brazeSession?: string;            // Optional: Braze session ID

  @IsOptional()
  @IsString()
  amplitudeSession?: string;         // Optional: Amplitude session ID

  @IsOptional()
  @IsString()
  brandId?: string;                 // Optional: brand context
}

// Quick identification by internal session ID
export class QuickIdentifyCustomerDto {
  @IsString()
  internalSessionId: string;        // Required: our internal session ID
}

// Find customer by session identifier
export class FindCustomerBySessionDto {
  @IsOptional()
  @IsString()
  brazeSession?: string;            // Find by Braze session

  @IsOptional()
  @IsString()
  amplitudeSession?: string;         // Find by Amplitude session

  @IsOptional()
  @IsString()
  internalSessionId?: string;        // Primary identifier

  @IsOptional()
  @IsEmail()
  email?: string;                   // Fallback for email changes
}

// Update customer's session
export class UpdateCustomerSessionDto {
  @IsString()
  internalSessionId: string;        // Required: our internal session ID

  @IsOptional()
  @IsEmail()
  email?: string;                   // Optional: updated email

  @IsOptional()
  @IsString()
  brazeSession?: string;            // Optional: Braze session ID

  @IsOptional()
  @IsString()
  amplitudeSession?: string;         // Optional: Amplitude session ID

  @IsOptional()
  @IsString()
  brandId?: string;                 // Optional: brand context
}

// Get customer session
export class GetCustomerSessionDto {
  @IsString()
  internalSessionId: string;        // Required: our internal session ID
}

// Find customer by email (for email changes)
export class FindCustomerByEmailDto {
  @IsEmail()
  email: string;                    // Required: customer email
}
