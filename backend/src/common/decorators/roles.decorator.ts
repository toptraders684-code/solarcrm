import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
// Using string to allow flexible role combinations without strict enum enforcement
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
