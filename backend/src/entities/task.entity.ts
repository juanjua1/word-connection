import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({
    type: 'varchar',
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date | null;

  @Column({ default: false })
  isCompleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Usuario que creó la tarea (quien la asignó)
  @ManyToOne(() => User, (user) => user.tasks, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  // Usuario asignado (quien debe realizar la tarea)
  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedToUser: User | null;

  @Column({ nullable: true })
  assignedToUserId: string | null;

  // Información de asignación
  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  assignedBy: string | null; // Nombre completo de quien asignó la tarea

  @ManyToOne(() => Category, (category) => category.tasks, { eager: true, nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @Column({ nullable: true })
  categoryId: string | null;

  // Campos para manejo de tareas atrasadas y visibilidad
  @Column({ default: false })
  isOverdue: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  // Fecha hasta la cual la tarea completada sigue visible (10 horas después de completada)
  @Column({ type: 'timestamp', nullable: true })
  visibleUntil: Date | null;
}
