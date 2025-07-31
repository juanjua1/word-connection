import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Task } from './task.entity';

export enum UserRole {
  COMMON = 'common',      // Usuario básico: crear/editar sus propias tareas
  PREMIUM = 'premium',    // Usuario premium: crear/editar tareas, crear grupos, lista de seguimiento
  ADMIN = 'admin',        // Administrador: acceso total al sistema
  SUPER_ADMIN = 'super_admin', // Super administrador: gestión de usuarios, configuración del sistema
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'varchar',
    default: UserRole.COMMON,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Task, (task) => task.user)
  tasks: Task[];
}
