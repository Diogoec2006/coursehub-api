import { UserRole } from '../../users/enums/user-role.enum.js';

export type JwtPayload = {
  sub: number;
  email: string;
  role: UserRole;
};
