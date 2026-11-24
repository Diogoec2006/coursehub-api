import {
  Body,
  Controller,
  Delete,
  Get,
  Optional,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CoursesService } from './courses.service.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';
import { UpdateCourseDto } from './dto/update-couerse.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/user-role.enum.js';
import { UpdateCourseUseCase } from './use-cases/update-course.use-case.js';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    @Optional() private readonly updateCourseUseCase?: UpdateCourseUseCase,
  ) {}

  @Get()
  findAll(@Query() query: CoursesQueryDto) {
    return this.coursesService.findAll(query);
  }

  // ParseIntPipe detiene datos inválidos antes de la regla de negocio (Sesión 21)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findOne(Number(id));
  }

  // Ruta de docente: protegida con JWT + RolesGuard (@Roles(TEACHER, ADMIN))
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @Post()
  create(@Body() createCourseDto: CreateCourseDto, @Req() req: Request) {
    const user = (req as any).user;
    return this.coursesService.create(createCourseDto, user?.sub ?? user?.id);
  }

  // Modificación de curso: protegida con JWT + RolesGuard + Caso de Uso desacoplado (Sesión 22)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    const actor = {
      id: user?.id ?? user?.sub ?? 0,
      role: user?.role ?? UserRole.STUDENT,
    };
    if (this.updateCourseUseCase) {
      return this.updateCourseUseCase.execute(Number(id), updateCourseDto, actor);
    }
    return this.coursesService.update(Number(id), updateCourseDto, user);
  }

  // Ruta administrativa: protegida con JWT + RolesGuard (@Roles(ADMIN))
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.remove(Number(id));
  }
}
