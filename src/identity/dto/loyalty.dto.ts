import { IsEmail, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

// DTO for customer loyalty profile
export class CustomerLoyaltyProfileDto {
  @IsEmail()
  email: string;
}

// DTO for loyalty metrics
export class LoyaltyMetricsDto {
  @IsNumber()
  totalSessions: number;

  @IsNumber()
  totalBrands: number;

  @IsBoolean()
  crossBrandActivity: boolean;

  @IsOptional()
  @IsString()
  lastActivity?: string;

  @IsOptional()
  lastBrand?: any;
}

// DTO for customer activity summary
export class CustomerActivityDto {
  @IsEmail()
  email: string;

  @IsNumber()
  sessionCount: number;

  @IsNumber()
  brandCount: number;

  @IsBoolean()
  crossBrandActivity: boolean;

  @IsOptional()
  @IsString()
  lastActivity?: string;
}

// DTO for loyalty program filters
export class LoyaltyFiltersDto {
  @IsOptional()
  @IsBoolean()
  crossBrandOnly?: boolean;

  @IsOptional()
  @IsNumber()
  minSessions?: number;

  @IsOptional()
  @IsNumber()
  minBrands?: number;
}
