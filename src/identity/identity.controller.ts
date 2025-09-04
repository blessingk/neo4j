import { Body, Controller, Get, Post, Query, HttpException, HttpStatus } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { IdentifyDto, Provider } from './dto/identify.dto';
import { LoginLinkDto } from './dto/login-link.dto';
import { UpsertBrandDto } from './dto/upsert-brand.dto';
import { 
  QuickIdentifyDto, 
  QuickIdentifyInternalDto,
  LinkExternalSessionDto,
  LinkInternalSessionDto,
  GetCustomerSessionsDto,
  FindCustomerDto
} from './dto/enhanced-session.dto';

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

  @Post('internal-session')
  async createInternalSession(@Body() dto: { internalSessionId: string; brandId: string }) {
    try {
      return await this.svc.createInternalSession(dto.internalSessionId, dto.brandId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Quick identification by external session (Braze/Amplitude)
  @Get('quick-identify-external')
  async quickIdentifyByExternalSession(@Query() query: QuickIdentifyDto) {
    try {
      return await this.svc.quickIdentifyByExternalSession(query);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Quick identification by internal session (after login)
  @Get('quick-identify-internal')
  async quickIdentifyByInternalSession(@Query() query: QuickIdentifyInternalDto) {
    try {
      return await this.svc.quickIdentifyByInternalSession(query);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Link external session to customer (first identification)
  @Post('link-external-session')
  async linkExternalSessionToCustomer(@Body() dto: LinkExternalSessionDto) {
    try {
      return await this.svc.linkExternalSessionToCustomer(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Link internal session to customer (after login)
  @Post('link-internal-session')
  async linkInternalSessionToCustomer(@Body() dto: LinkInternalSessionDto) {
    try {
      return await this.svc.linkInternalSessionToCustomer(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Link internal session to existing external sessions (stitching)
  @Post('link-internal-to-existing')
  async linkInternalToExistingSessions(@Body() dto: LinkInternalSessionDto) {
    try {
      return await this.svc.linkInternalToExistingSessions(dto);
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

  @Get('find-customer')
  async findCustomerByAnySession(@Query() query: FindCustomerDto) {
    try {
      return await this.svc.findCustomerByAnySession(query);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('customer-with-sessions')
  async getCustomerWithSessions(@Query() query: GetCustomerSessionsDto) {
    try {
      return await this.svc.getCustomerWithSessions(query);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('customer-latest-session')
  async getCustomerLatestSession(@Query('email') email: string) {
    try {
      return await this.svc.getCustomerLatestSession(email);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
