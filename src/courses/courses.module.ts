import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './entities/course.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { COURSE_REPOSITORY } from './ports/course.repository.js';
import { TypeOrmCourseRepository } from './adapters/typeorm-course.repository.js';
import { UpdateCourseUseCase } from './use-cases/update-course.use-case.js';
import { COURSE_NOTIFIER } from './ports/course-notifier.port.js';
import { CoursesGateway } from './gateways/courses.gateway.js';

@Module({
  imports: [TypeOrmModule.forFeature([Course]), AuthModule],
  controllers: [CoursesController],
  providers: [
    CoursesService,
    UpdateCourseUseCase,
    CoursesGateway,
    {
      provide: COURSE_REPOSITORY,
      useClass: TypeOrmCourseRepository,
    },
    {
      provide: COURSE_NOTIFIER,
      useClass: CoursesGateway,
    },
  ],
  exports: [CoursesService, UpdateCourseUseCase, COURSE_REPOSITORY, COURSE_NOTIFIER, CoursesGateway],
})
export class CoursesModule {}
