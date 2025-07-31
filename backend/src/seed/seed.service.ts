import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Category } from '../entities/category.entity';
import { AdminUserSeeder } from './admin-user.seeder';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.seedCategories();
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    await AdminUserSeeder.run(this.dataSource);
  }

  private async seedCategories() {
    const existingCategories = await this.categoryRepository.count();

    if (existingCategories === 0) {
      const defaultCategories = [
        {
          name: 'Trabajo',
          description: 'Tareas relacionadas con el trabajo',
          color: '#007bff',
        },
        {
          name: 'Personal',
          description: 'Tareas personales y de tiempo libre',
          color: '#28a745',
        },
        {
          name: 'Urgente',
          description: 'Tareas que requieren atención inmediata',
          color: '#dc3545',
        },
        {
          name: 'Estudio',
          description: 'Tareas académicas y de aprendizaje',
          color: '#6f42c1',
        },
        {
          name: 'Hogar',
          description: 'Tareas del hogar y domésticas',
          color: '#fd7e14',
        },
      ];

      for (const categoryData of defaultCategories) {
        const category = this.categoryRepository.create(categoryData);
        await this.categoryRepository.save(category);
      }

      console.log('Default categories seeded successfully');
    }
  }
}
