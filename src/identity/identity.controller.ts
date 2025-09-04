import { Body, Controller, Get, Post, Query, HttpException, HttpStatus } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { IdentifyDto, Provider } from './dto/identify.dto';
import { LoginLinkDto } from './dto/login-link.dto';
import { UpsertBrandDto } from './dto/upsert-brand.dto';

@Controller('identity')
export class IdentityController {
  constructor(private readonly svc: IdentityService) {}

  @Post('brand')
  async upsertBrand(@Body() dto: UpsertBrandDto) {
    try {
      return await this.svc.upsertBrand(dto.id, dto.name, dto.slug);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('identify')
  async identify(@Body() dto: IdentifyDto) {
    try {
      return await this.svc.identify(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('link-login')
  async link(@Body() dto: LoginLinkDto) {
    try {
      return await this.svc.linkOnLogin(dto);
    } catch (error) {
      if (error.message === 'No linking attribute provided (email/phone/identity).') {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('customer-for-session')
  async getCustomer(
    @Query('provider') provider: Provider,
    @Query('externalSessionId') externalSessionId: string
  ) {
    try {
      return await this.svc.getCustomerForSession(provider, externalSessionId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
