

import { UserRole, View, ActionPermission } from '../types';

export const ALL_VIEWS: View[] = ['dashboard', 'equipment', 'service-orders', 'assistant', 'preventive-maintenance', 'chat', 'user-management', 'users', 'partners', 'analysis', 'failure-modes', 'quotes', 'metrology', 'service-categories'];
export const ALL_ACTIONS: ActionPermission[] = ['equipment:create', 'equipment:edit', 'equipment:delete'];

type PermissionSet = {
  views: View[];
  actions: ActionPermission[];
};

export const DEFAULT_PERMISSIONS: Record<UserRole, PermissionSet> = {
  [UserRole.Admin]: {
    views: ALL_VIEWS,
    actions: ALL_ACTIONS,
  },
  [UserRole.Manager]: {
    views: [
      'dashboard',
      'equipment',
      'service-orders',
      'assistant',
      'preventive-maintenance',
      'chat',
      'user-management', // For managing their own team
      'users',
      'partners',
      'analysis',
      'failure-modes',
      'quotes',
      'metrology',
      'service-categories'
    ],
    actions: ['equipment:create', 'equipment:edit'],
  },
  [UserRole.Technician]: {
    views: [
      'dashboard',
      'equipment',
      'service-orders',
      'assistant',
      'preventive-maintenance',
      'chat',
      'users',
      'user-management', // Allow technicians to create/view their team
      'partners',
      'analysis',
      'quotes',
      'metrology'
    ],
    actions: [],
  },
};