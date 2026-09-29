// courses/dto/update-course.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseDto } from './create-course.dto.js'; // Mantenemos el .js como usas en tu proyecto

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}