import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Course } from '../entities/course.entity.js';
import {
  COURSE_REPOSITORY,
  type CourseRepository,
} from '../ports/course.repository.js';
import {
  COURSE_NOTIFIER,
  type CourseNotifier,
} from '../ports/course-notifier.port.js';
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
    @Optional()
    @Inject(COURSE_NOTIFIER)
    private readonly notifier?: CourseNotifier,
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
    const savedCourse = await this.courses.save(course);

    // Sesión 30 · Extensión Tecnológica: Notificación en tiempo real a suscriptor autorizado
    if (this.notifier) {
      this.notifier.notifyCourseUpdated(savedCourse);
    }

    return savedCourse;
  }
}
