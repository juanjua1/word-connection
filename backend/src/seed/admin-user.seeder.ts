import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../entities/user.entity';

export class AdminUserSeeder {
  static async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    // Verificar si ya existe un usuario admin
    const existingAdmin = await userRepository.findOne({
      where: { role: UserRole.ADMIN },
    });

    if (existingAdmin) {
      console.log('👤 Usuario administrador ya existe');
      return;
    }

    // Crear usuario admin por defecto
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = userRepository.create({
      email: 'admin@taskmanager.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
    });

    await userRepository.save(adminUser);
    console.log('👤 Usuario administrador creado: admin@taskmanager.com / admin123');

    // Crear algunos usuarios comunes de ejemplo
    const commonUsers = [
      {
        email: 'user1@taskmanager.com',
        password: await bcrypt.hash('user123', 10),
        firstName: 'Juan',
        lastName: 'Pérez',
        role: UserRole.COMMON,
      },
      {
        email: 'user2@taskmanager.com',
        password: await bcrypt.hash('user123', 10),
        firstName: 'María',
        lastName: 'García',
        role: UserRole.COMMON,
      },
      {
        email: 'user3@taskmanager.com',
        password: await bcrypt.hash('user123', 10),
        firstName: 'Carlos',
        lastName: 'López',
        role: UserRole.COMMON,
      },
    ];

    for (const userData of commonUsers) {
      const existingUser = await userRepository.findOne({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const user = userRepository.create(userData);
        await userRepository.save(user);
        console.log(`👤 Usuario común creado: ${userData.email} / user123`);
      }
    }
  }
}
