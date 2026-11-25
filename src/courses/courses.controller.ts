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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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

@ApiTags('Courses')
@Controller({ path: 'courses', version: '1' })
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    @Optional() private readonly updateCourseUseCase?: UpdateCourseUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar cursos con paginación y filtros (Lectura pública)',
    description: 'Endpoint público para consultar el catálogo de cursos con soporte de paginación y filtrado por nivel.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cursos obtenida exitosamente.',
  })
  findAll(@Query() query: CoursesQueryDto) {
    return this.coursesService.findAll(query);
  }

  // ParseIntPipe detiene datos inválidos antes de la regla de negocio (Sesión 21)
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un curso por ID',
    description: 'Retorna el detalle completo de un curso existente según su identificador numérico.',
  })
  @ApiResponse({
    status: 200,
    description: 'Curso encontrado con éxito.',
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido (ValidationPipe / ParseIntPipe rechaza valor no numérico).',
  })
  @ApiResponse({
    status: 404,
    description: 'Curso no encontrado.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findOne(Number(id));
  }

  // Ruta de docente: protegida con JWT + RolesGuard (@Roles(TEACHER, ADMIN))
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear un nuevo curso',
    description: 'Ruta protegida para usuarios con rol TEACHER o ADMIN. Asigna automáticamente la autoría al usuario autenticado.',
  })
  @ApiResponse({
    status: 201,
    description: 'Curso creado exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'DTO inválido (ValidationPipe rechaza datos incompletos o nivel inválido).',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado: Token JWT ausente o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado: Rol insuficiente (se requiere TEACHER o ADMIN).',
  })
  create(@Body() createCourseDto: CreateCourseDto, @Req() req: Request) {
    const user = (req as any).user;
    return this.coursesService.create(createCourseDto, user?.sub ?? user?.id);
  }

  // Modificación de curso: protegida con JWT + RolesGuard + Caso de Uso desacoplado (Sesión 22)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar un curso existente',
    description: 'Aplica política de propiedad delegando en UpdateCourseUseCase: solo el docente propietario o un ADMIN pueden modificarlo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Curso actualizado exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de actualización inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado: Token JWT ausente o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado: No tienes permiso para modificar este curso (violación de política de propiedad).',
  })
  @ApiResponse({
    status: 404,
    description: 'Curso no encontrado.',
  })
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
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Eliminar un curso',
    description: 'Ruta exclusiva para administradores (@Roles(UserRole.ADMIN)).',
  })
  @ApiResponse({
    status: 200,
    description: 'Curso eliminado exitosamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado: Token JWT ausente o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado: Solo usuarios con rol ADMIN pueden eliminar cursos.',
  })
  @ApiResponse({
    status: 404,
    description: 'Curso no encontrado.',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.remove(Number(id));
  }
}
