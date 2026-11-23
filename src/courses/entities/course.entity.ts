import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Enrollment } from '../../enrollments/entities/enrollment.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  level: string;

  @Column({ type: 'integer', nullable: true })
  teacherId?: number | null;

  get createdByUserId(): number | null | undefined {
    return this.teacherId;
  }

  set createdByUserId(val: number | null | undefined) {
    this.teacherId = val;
  }

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'teacherId' })
  teacher?: Relation<User>;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Relation<Enrollment>[];
}
