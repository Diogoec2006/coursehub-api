import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { GetEnrollmentsFilterDto } from './dto/get-enrollments-filter.dto.js';
import { ParseIdPipe } from '../students/pipes/parse-id.pipe.js';

@Controller()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('enrollments')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Get('enrollments')
  findAll(@Query() filterDto: GetEnrollmentsFilterDto) {
    return this.enrollmentsService.findAll(filterDto);
  }

  @Get('enrollments/:id')
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.enrollmentsService.findOne(id);
  }

  @Delete('enrollments/:id')
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.enrollmentsService.remove(id);
  }

  @Get('students/:studentId/enrollments')
  findByStudent(@Param('studentId', ParseIdPipe) studentId: number) {
    return this.enrollmentsService.findByStudentId(studentId);
  }

  @Get('courses/:courseId/enrollments')
  findByCourse(@Param('courseId', ParseIdPipe) courseId: number) {
    return this.enrollmentsService.findByCourseId(courseId);
  }
}
