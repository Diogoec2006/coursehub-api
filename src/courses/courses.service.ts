import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-couerse.dto.js'; // Asegúrate de tener este DTO
import { Course } from './entities/course.entity.js';

@Injectable()
export class CoursesService {
  // Inyectamos el repositorio para conectar con PostgreSQL y TypeORM
  constructor(
    @InjectRepository(Course) 
    private readonly courseRepository: Repository<Course>
  ) {}

  // GET: Devuelve toda la colección, opcionalmente filtrada por level
  async findAll(level?: string): Promise<Course[]> {
    if (!level) {
      return await this.courseRepository.find();
    }
    return await this.courseRepository.find({ where: { level } });
  }

  // GET por ID: Devuelve un curso específico o lanza error 404 (Requisito de etapa)
  async findOne(id: number): Promise<Course> {
    const course = await this.courseRepository.findOneBy({ id });
    
    // Centralizamos la decisión de error en el servicio
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    
    return course;
  }

  // POST: Crea y persiste el recurso en PostgreSQL
  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    const newCourse = this.courseRepository.create(createCourseDto);
    return await this.courseRepository.save(newCourse);
  }

  // PATCH: Actualiza parcialmente un curso
  async update(id: number, updateCourseDto: UpdateCourseDto): Promise<Course> {
    // Reutilizamos findOne que ya maneja el error 404 si no existe
    const course = await this.findOne(id);
    
    // Mezclamos los datos nuevos con los existentes
    Object.assign(course, updateCourseDto);
    
    return await this.courseRepository.save(course);
  }

  // DELETE: Elimina un curso
  async remove(id: number): Promise<Course> {
    // Buscamos el curso primero para devolverlo y asegurarnos de que exista
    const course = await this.findOne(id);
    await this.courseRepository.remove(course);
    return course;
  }
}