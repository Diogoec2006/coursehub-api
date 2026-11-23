import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Course } from '../entities/course.entity.js';
import {
  COURSE_REPOSITORY,
  type CourseRepository,
} from '../ports/course.repository.js';
import { UpdateCourseDto } from '../dto/update-couerse.dto.js';
import { UserRole } from '../../users/enums/user-role.enum.js';

export interface UpdateCourseActor {
  id: number;
  role: UserRole;
}

@Injectable()
export class UpdateCourseUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courses: CourseRepository,
  ) {}

  async execute(
    id: number,
    changes: UpdateCourseDto,
    actor: UpdateCourseActor,
  ): Promise<Course> {
    const course = await this.courses.findById(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const ownerId = course.createdByUserId ?? course.teacherId;
    if (
      actor.role !== UserRole.ADMIN &&
      (actor.role !== UserRole.TEACHER || ownerId !== actor.id)
    ) {
      throw new ForbiddenException('You cannot modify this course');
    }

    Object.assign(course, changes);
    return this.courses.save(course);
  }
}
