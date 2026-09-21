import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Student } from './entities/student.entity.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { GetStudentsFilterDto } from './dto/get-students-filter.dto.js';

@Injectable()
export class StudentsService {
    private students: Student[] = [
        {
            id: 1,
            name: 'Ana García',
            email: 'ana.garcia@example.com',
            age: 20,
            career: 'Ingeniería de Sistemas',
            semester: 4,
            isActive: true,
        },
        {
            id: 2,
            name: 'Carlos López',
            email: 'carlos.lopez@example.com',
            age: 22,
            career: 'Medicina',
            semester: 6,
            isActive: false,
        },
        {
            id: 3,
            name: 'María Rodríguez',
            email: 'maria.rodriguez@example.com',
            age: 19,
            career: 'Ingeniería de Sistemas',
            semester: 2,
            isActive: true,
        },
    ];
    private nextId: number = 4;

    findAll(filterDto?: GetStudentsFilterDto): Student[] {
        let result = [...this.students];

        if (!filterDto) {
            return result;
        }

        const { career, semester, isActive } = filterDto;

        if (career !== undefined && career.trim() !== '') {
            result = result.filter(
                (student) =>
                    student.career.toLowerCase() === career.trim().toLowerCase(),
            );
        }

        if (semester !== undefined) {
            result = result.filter((student) => student.semester === semester);
        }

        if (isActive !== undefined) {
            result = result.filter((student) => student.isActive === isActive);
        }

        return result;
    }

    findOne(id: number): Student {
        const student = this.students.find((s) => s.id === id);
        if (!student) {
            throw new NotFoundException(
                `Estudiante con identificador ${id} no encontrado.`,
            );
        }
        return student;
    }

    create(createStudentDto: CreateStudentDto): Student {
        const emailExists = this.students.some(
            (s) =>
                s.email.toLowerCase() === createStudentDto.email.trim().toLowerCase(),
        );

        if (emailExists) {
            throw new ConflictException(
                `El correo electrónico '${createStudentDto.email}' ya se encuentra registrado por otro estudiante.`,
            );
        }

        const newStudent: Student = {
            id: this.nextId++,
            name: createStudentDto.name.trim(),
            email: createStudentDto.email.trim().toLowerCase(),
            age: createStudentDto.age,
            career: createStudentDto.career.trim(),
            semester: createStudentDto.semester,
            isActive: createStudentDto.isActive ?? true,
        };

        this.students.push(newStudent);
        return newStudent;
    }

    update(id: number, updateStudentDto: UpdateStudentDto): Student {
        const student = this.findOne(id);

        if (updateStudentDto.email) {
            const email = updateStudentDto.email.trim().toLowerCase();
            const emailExists = this.students.some(
                (s) => s.id !== id && s.email.toLowerCase() === email,
            );

            if (emailExists) {
                throw new ConflictException(
                    `El correo electrónico '${updateStudentDto.email}' ya se encuentra registrado por otro estudiante.`,
                );
            }
        }

        if (updateStudentDto.name !== undefined)
            student.name = updateStudentDto.name.trim();
        if (updateStudentDto.email !== undefined)
            student.email = updateStudentDto.email.trim().toLowerCase();
        if (updateStudentDto.age !== undefined) student.age = updateStudentDto.age;
        if (updateStudentDto.career !== undefined)
            student.career = updateStudentDto.career.trim();
        if (updateStudentDto.semester !== undefined)
            student.semester = updateStudentDto.semester;
        if (updateStudentDto.isActive !== undefined)
            student.isActive = updateStudentDto.isActive;

        return student;
    }

    updateStatus(id: number, isActive: boolean): Student {
        const student = this.findOne(id);
        student.isActive = isActive;
        return student;
    }

    remove(id: number): Student {
        const student = this.findOne(id);

        if (!student.isActive) {
            throw new BadRequestException(
                `No se puede eliminar al estudiante '${student.name}' porque se encuentra en estado inactivo.`,
            );
        }

        const index = this.students.findIndex((s) => s.id === id);
        const [removedStudent] = this.students.splice(index, 1);
        return removedStudent;
    }
}
