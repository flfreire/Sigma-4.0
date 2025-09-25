

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

export enum PartnerType {
  Supplier = 'Supplier',
  ServiceProvider = 'ServiceProvider',
}

export enum QuoteStatus {
  Draft = 'Draft',
  Sent = 'Sent',
  Answered = 'Answered',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export enum QuoteType {
  Parts = 'Parts',
  Service = 'Service',
}

export enum InstrumentStatus {
  Active = 'Active',
  InCalibration = 'In Calibration',
  Damaged = 'Damaged',
  Retired = 'Retired',
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

export interface CalibrationLog {
  id: string;
  date: string; // ISO date
  technician: string;
  certificateNumber: string;
  notes: string;
  result: 'Approved' | 'Rejected';
}

export interface MeasurementInstrument {
  id: string; // User-defined ID (e.g., PAQ-001)
  name: string; // e.g., "Digital Caliper"
  model: string;
  manufacturer: string;
  serialNumber?: string;
  purchaseDate: string; // ISO date
  status: InstrumentStatus;
  location: string;
  calibrationIntervalMonths: number;
  lastCalibrationDate?: string; // ISO date
  nextCalibrationDate?: string; // ISO date
  calibrationHistory: CalibrationLog[];
}

export interface ReplacementPart {
  id: string;
  name: string;
  code: string;
  equipmentId: string;
  stockQuantity: number;
  supplier: string;
}

export interface FailureMode {
  id: string;
  name: string;
  description: string;
  equipmentType: 'Machinery' | 'Tooling' | 'Automation' | 'Body in White' | string;
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
  openedDate?: string; // ISO string for when the order was created/opened
  closedDate?: string; // ISO string for when the order was completed/cancelled
  maintenanceDuration?: number; // Duration in hours
  failureModeId?: string; // ID of the failure mode for corrective maintenance
}

export interface PredictiveAnalysis {
  healthAnalysis: string;
  nextMaintenanceRecommendation: string;
  potentialRisks: string[];
}

export type View = 'dashboard' | 'equipment' | 'service-orders' | 'assistant' | 'preventive-maintenance' | 'chat' | 'user-management' | 'users' | 'partners' | 'checklists' | 'analysis' | 'failure-modes' | 'quotes' | 'metrology';

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

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface Quote {
  id: string;
  partnerId: string;
  quoteType: QuoteType;
  status: QuoteStatus;
  title: string;
  description: string;
  requestDate: string; // ISO string
  responseDate?: string; // ISO string
  items: QuoteItem[];
  attachments?: ProjectFile[];
  requesterUserId: string;
  totalCost?: number;
  notes?: string;
}