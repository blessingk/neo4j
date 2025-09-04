import { IsString } from 'class-validator';

export class UpsertBrandDto { 
  @IsString() 
  id: string; 
  
  @IsString() 
  name: string; 
  
  @IsString() 
  slug: string; 
}
