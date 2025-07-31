import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedCategories();
    await this.seedUsers();
  }

  private async seedCategories() {
    const count = await this.categoryRepository.count();
    if (count === 0) {
      const categories = [
        {
          name: 'Desarrollo',
          description: 'Tareas relacionadas con desarrollo de software',
          color: '#3B82F6',
        },
        {
          name: 'Diseño',
          description: 'Tareas de diseño gráfico y UX/UI',
          color: '#8B5CF6',
        },
        {
          name: 'Marketing',
          description: 'Tareas de marketing y publicidad',
          color: '#10B981',
        },
        {
          name: 'Administración',
          description: 'Tareas administrativas y de gestión',
          color: '#F59E0B',
        },
        {
          name: 'Soporte',
          description: 'Tareas de soporte técnico y atención al cliente',
          color: '#EF4444',
        },
      ];

      for (const categoryData of categories) {
        const category = this.categoryRepository.create(categoryData);
        await this.categoryRepository.save(category);
      }

      console.log('✅ Categorías creadas exitosamente');
    }
  }

  private async seedUsers() {
    // Verificar si ya existe el usuario admin por defecto
    const adminExists = await this.userRepository.findOne({
      where: { role: UserRole.ADMIN }
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = this.userRepository.create({
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'System',
        role: UserRole.ADMIN,
        isActive: true,
      });
      await this.userRepository.save(admin);
      console.log('👤 Usuario administrador creado: admin@example.com / admin123');
    }

    // Crear algunos usuarios de prueba
    const userCount = await this.userRepository.count();
    if (userCount < 5) {
      const testUsers = [
        {
          email: 'usuario1@example.com',
          password: await bcrypt.hash('user123', 10),
          firstName: 'Juan',
          lastName: 'Pérez',
          role: UserRole.COMMON,
          isActive: true,
        },
        {
          email: 'usuario2@example.com',
          password: await bcrypt.hash('user123', 10),
          firstName: 'María',
          lastName: 'García',
          role: UserRole.COMMON,
          isActive: true,
        },
        {
          email: 'premium1@example.com',
          password: await bcrypt.hash('premium123', 10),
          firstName: 'Carlos',
          lastName: 'López',
          role: UserRole.PREMIUM,
          isActive: true,
        },
      ];

      for (const userData of testUsers) {
        const existingUser = await this.userRepository.findOne({
          where: { email: userData.email }
        });
        if (!existingUser) {
          const user = this.userRepository.create(userData);
          await this.userRepository.save(user);
        }
      }

      console.log('👥 Usuarios de prueba creados');
    }
  }
}
