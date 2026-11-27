import { Course } from '../entities/course.entity.js';

export const COURSE_NOTIFIER = Symbol('COURSE_NOTIFIER');

export interface CourseNotifier {
  notifyCourseUpdated(course: Course): void;
}
