import { Injectable, Inject } from '@nestjs/common';
import { Neo4jOGMService } from '../neo4j-ogm.service';
import { BrandInstance } from '../types';

@Injectable()
export class BrandRepository {
  constructor(@Inject('NEO4J_OGM') private readonly ogmService: Neo4jOGMService) {}

  async upsertBrand(id: string, name: string, slug: string): Promise<BrandInstance | null> {
    try {
      const Brand = this.ogmService.getBrand();
      
      // Try to find existing brand first
      let brand = await Brand.findOne({
        where: { id },
      });

      if (brand) {
        // Update existing brand
        brand.name = name;
        brand.slug = slug;
        brand = await brand.save();
      } else {
        // Create new brand
        brand = await Brand.createOne({
          id,
          name,
          slug,
        });
      }

      return brand;
    } catch (error) {
      console.error('Brand upsert failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  async findById(id: string): Promise<BrandInstance | null> {
    try {
      const Brand = this.ogmService.getBrand();
      return await Brand.findOne({
        where: { id },
      });
    } catch (error) {
      console.error('Brand findById failed:', error.message);
      throw new Error('Database operation failed');
    }
  }

  async findAll(): Promise<BrandInstance[]> {
    try {
      const Brand = this.ogmService.getBrand();
      return await Brand.findMany();
    } catch (error) {
      console.error('Brand findAll failed:', error.message);
      throw new Error('Database operation failed');
    }
  }
}