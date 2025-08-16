
export enum EquipmentStatus {
  Operational = 'Operational',
  InMaintenance = 'In Maintenance',
  NeedsRepair = 'Needs Repair',
  Decommissioned = 'Decommissioned',
}

export enum MaintenanceType {
  Corrective = 'Corrective',
  Preventive = 'Preventive',
  Predictive = 'Predictive',
  Rehabilitation = 'Rehabilitation',
}

export enum ServiceOrderStatus {
  Open = 'Open',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum UserRole {
  Admin = 'Admin',
  Manager = 'Manager',
  Technician = 'Technician',
}

export enum PreventiveMaintenanceSchedule {
  None = 'None',
  Monthly = 'Monthly',
  Bimonthly = 'Bimonthly',
  Trimonthly = 'Trimonthly',
  Semiannual = 'Semiannual',
  Annual = 'Annual',
}

export enum ChecklistItemType {
  OK_NOT_OK = 'OK_NOT_OK',
  NUMERIC = 'NUMERIC',
}

export interface MaintenanceLog {
  date: string;
  description: string;
  type: MaintenanceType;
}

export interface ChecklistItem {
  id: string;
  text: string;
  type: ChecklistItemType;
  order: number;
}

export interface ChecklistTemplate {
  id:string;
  name: string;
  items: ChecklistItem[];
}

export interface ChecklistResultItem {
  checklistItemId: string;
  status: 'OK' | 'NOT_OK' | null;
  value: string | null;
  notes: string;
}

export interface ChecklistExecution {
  id: string;
  serviceOrderId: string;
  equipmentId: string;
  checklistTemplateId: string;
  executionDate: string;
  executedByUserId: string;
  results: ChecklistResultItem[];
}

export interface ProjectFile {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  data: string; // base64 data URI
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string;
  manufacturer: string;
  location: string;
  status: EquipmentStatus;
  installDate: string;
  usageHours: number;
  maintenanceHistory: MaintenanceLog[];
  photo?: string;
  preventiveSchedule?: PreventiveMaintenanceSchedule;
  nextPreventiveMaintenanceDate?: string;
  checklistTemplateId?: string;
  projectFiles?: ProjectFile[];
}

export interface ReplacementPart {
  id: string;
  name: string;
  code: string;
  equipmentId: string;
  stockQuantity: number;
  supplier: string;
}

export interface ServiceOrder {
  id: string;
  equipmentId: string;
  type: MaintenanceType;
  status: ServiceOrderStatus;
  description: string;
  scheduledDate: string;
  completedDate?: string;
  assignedToTeamId?: string;
  checklistExecutionId?: string;
  rehabilitationCost?: number;
  photos?: string[];
}

export interface PredictiveAnalysis {
  healthAnalysis: string;
  nextMaintenanceRecommendation: string;
  potentialRisks: string[];
}

export type View = 'dashboard' | 'equipment' | 'service-orders' | 'assistant' | 'preventive-maintenance' | 'chat' | 'user-management' | 'users' | 'suppliers' | 'checklists';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  teamId?: string;
  role: UserRole;
  permissions: View[];
}

export interface Team {
    id: string;
    name: string;
    ownerId: string;
    members: string[]; // array of user IDs
}

export interface ChatMessage {
  id:string;
  teamId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}