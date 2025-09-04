import { IsString, IsNotEmpty } from 'class-validator';

export class UpsertBrandDto { 
  @IsString() 
  @IsNotEmpty()
  id: string; 
  
  @IsString() 
  @IsNotEmpty()
  name: string; 
  
  @IsString() 
  @IsNotEmpty()
  slug: string; 
}
