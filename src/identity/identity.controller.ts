import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { IdentifyDto, Provider } from './dto/identify.dto';
import { LoginLinkDto } from './dto/login-link.dto';
import { UpsertBrandDto } from './dto/upsert-brand.dto';

@Controller('identity')
export class IdentityController {
  constructor(private readonly svc: IdentityService) {}

  @Post('brand')
  upsertBrand(@Body() dto: UpsertBrandDto) {
    return this.svc.upsertBrand(dto.id, dto.name, dto.slug);
  }

  @Post('identify')
  identify(@Body() dto: IdentifyDto) {
    return this.svc.identify(dto);
  }

  @Post('link-login')
  link(@Body() dto: LoginLinkDto) {
    return this.svc.linkOnLogin(dto);
  }

  @Get('customer-for-session')
  getCustomer(
    @Query('provider') provider: Provider,
    @Query('externalSessionId') externalSessionId: string
  ) {
    return this.svc.getCustomerForSession(provider, externalSessionId);
  }
}
