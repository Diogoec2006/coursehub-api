import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Repository } from 'typeorm';
import { TypeOrmCourseRepository } from './typeorm-course.repository.js';
import { Course } from '../entities/course.entity.js';

describe('TypeOrmCourseRepository (Adaptador de Infraestructura)', () => {
  let adapter: TypeOrmCourseRepository;
  let mockTypeOrmRepo: Repository<Course>;

  const sampleCourse: Course = {
    id: 1,
    title: 'Curso de Prueba',
    level: 'beginner',
    teacherId: 5,
    enrollments: [],
  } as Course;

  beforeEach(() => {
    mockTypeOrmRepo = {
      findOneBy: vi.fn(),
      save: vi.fn(),
    } as any;
    adapter = new TypeOrmCourseRepository(mockTypeOrmRepo);
  });

  it('findById debe delegar la consulta a repository.findOneBy con el ID esperado', async () => {
    vi.mocked(mockTypeOrmRepo.findOneBy).mockResolvedValue(sampleCourse);

    const result = await adapter.findById(1);

    expect(mockTypeOrmRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(result).toEqual(sampleCourse);
  });

  it('save debe persistir el curso delegando a repository.save', async () => {
    vi.mocked(mockTypeOrmRepo.save).mockResolvedValue(sampleCourse);

    const result = await adapter.save(sampleCourse);

    expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(sampleCourse);
    expect(result).toEqual(sampleCourse);
  });
});
