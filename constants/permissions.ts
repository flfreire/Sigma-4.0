
import { UserRole, View } from '../types';

export const ALL_VIEWS: View[] = ['dashboard', 'equipment', 'service-orders', 'assistant', 'preventive-maintenance', 'chat', 'user-management', 'users', 'suppliers', 'checklists'];

export const DEFAULT_PERMISSIONS: Record<UserRole, View[]> = {
  [UserRole.Admin]: ALL_VIEWS,
  [UserRole.Manager]: [
    'dashboard',
    'equipment',
    'service-orders',
    'assistant',
    'preventive-maintenance',
    'chat',
    'user-management', // For managing their own team
    'users',
    'suppliers',
    'checklists',
  ],
  [UserRole.Technician]: [
    'dashboard',
    'equipment',
    'service-orders',
    'assistant',
    'preventive-maintenance',
    'chat',
    'users',
    'user-management', // Allow technicians to create/view their team
    'suppliers',
    'checklists',
  ],
};
