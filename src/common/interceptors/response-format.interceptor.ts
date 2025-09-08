import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        console.log('Interceptor received data:', JSON.stringify(data, null, 2));
        const formatted = this.formatResponse(data);
        console.log('Interceptor formatted data:', JSON.stringify(formatted, null, 2));
        return formatted;
      })
    );
  }

  private formatResponse(data: any): any {
    if (!data) return data;
    
    // If it's a Neogma object with dataValues, extract the data
    if (data.dataValues && typeof data.dataValues === 'object') {
      return data.dataValues;
    }
    
    // If it's an object with customer/session/brand properties
    if (typeof data === 'object') {
      const formatted: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === 'object' && (value as any).dataValues) {
          formatted[key] = (value as any).dataValues;
        } else if (value && typeof value === 'object') {
          formatted[key] = this.formatResponse(value);
        } else {
          formatted[key] = value;
        }
      }
      
      return formatted;
    }
    
    return data;
  }
}
