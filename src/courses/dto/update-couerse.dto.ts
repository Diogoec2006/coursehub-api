// courses/dto/update-course.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateCourseDto } from './create-course.dto.js'; // Mantenemos el .js como usas en tu proyecto

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}