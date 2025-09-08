import { Body, Controller, Get, Post, Query, HttpException, HttpStatus } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { IdentifyDto, Provider } from './dto/identify.dto';
import { LoginLinkDto } from './dto/login-link.dto';
import { UpsertBrandDto } from './dto/upsert-brand.dto';
import { 
  CustomerSessionDto,
  QuickIdentifyCustomerDto,
  FindCustomerBySessionDto,
  UpdateCustomerSessionDto,
  GetCustomerSessionDto
} from './dto/single-session.dto';

@Controller('identity')
export class IdentityController {
  constructor(private readonly svc: IdentityService) {}

  @Post('brand')
  async upsertBrand(@Body() dto: UpsertBrandDto) {
    try {
      console.log('Controller upsertBrand called with:', dto);
      const result = await this.svc.upsertBrand(dto.id, dto.name, dto.slug);
      console.log('Controller returning:', result);
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Create or update customer's single long-lived session
  @Post('customer-session')
  async createOrUpdateCustomerSession(@Body() dto: CustomerSessionDto) {
    try {
      return await this.svc.createOrUpdateCustomerSession(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Quick identification by customer email
  @Get('quick-identify-customer')
  async quickIdentifyCustomer(@Query() query: QuickIdentifyCustomerDto) {
    try {
      return await this.svc.quickIdentifyCustomer(query);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Find customer by any session identifier
  @Get('find-customer-by-session')
  async findCustomerBySession(@Query() query: FindCustomerBySessionDto) {
    try {
      return await this.svc.findCustomerBySession(query);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Update customer's session (when they visit again)
  @Post('update-customer-session')
  async updateCustomerSession(@Body() dto: UpdateCustomerSessionDto) {
    try {
      return await this.svc.updateCustomerSession(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get customer's single session
  @Get('customer-session')
  async getCustomerSession(@Query() query: GetCustomerSessionDto) {
    try {
      return await this.svc.getCustomerSession(query);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get all customers with their sessions
  @Get('all-customers-sessions')
  async getAllCustomersWithSessions() {
    try {
      return await this.svc.getAllCustomersWithSessions();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get customer loyalty profile (simplified)
  @Get('customer-loyalty-profile')
  async getCustomerLoyaltyProfile(@Query('internalSessionId') internalSessionId: string) {
    try {
      return await this.svc.getCustomerLoyaltyProfile({ internalSessionId });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Legacy endpoints for backward compatibility
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
      if (error.message === 'Email is required for session linking') {
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
      // Map provider to appropriate session field
      let brazeSession = null;
      let amplitudeSession = null;
      
      if (provider === 'braze' && externalSessionId) {
        brazeSession = externalSessionId;
      } else if (provider === 'amplitude' && externalSessionId) {
        amplitudeSession = externalSessionId;
      }
      
      const result = await this.svc.findCustomerBySession({ 
        brazeSession, 
        amplitudeSession 
      });
      return result?.customer || null;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
