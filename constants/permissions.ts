

import { UserRole, View } from '../types';

export const ALL_VIEWS: View[] = ['dashboard', 'equipment', 'service-orders', 'assistant', 'preventive-maintenance', 'chat', 'user-management', 'users', 'partners', 'checklists', 'analysis', 'failure-modes', 'quotes', 'metrology'];

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
    'partners',
    'checklists',
    'analysis',
    'failure-modes',
    'quotes',
    'metrology'
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
    'partners',
    'checklists',
    'analysis',
    'quotes',
    'metrology'
  ],
};