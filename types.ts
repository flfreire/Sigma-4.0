

export type View =
  | 'dashboard'
  | 'equipment'
  | 'service-orders'
  | 'assistant'
  | 'preventive-maintenance'
  | 'chat'
  | 'user-management'
  | 'users'
  | 'partners'
  | 'analysis'
  | 'failure-modes'
  | 'quotes'
  | 'metrology'
  | 'service-categories';

export type ActionPermission =
  | 'equipment:create'
  | 'equipment:edit'
  | 'equipment:delete';

export enum UserRole {
  Admin = 'Admin',
  Manager = 'Manager',
  Technician = 'Technician',
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  permissions: View[];
  actionPermissions: ActionPermission[];
  teamId?: string;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: string[]; // array of user IDs
}

export interface ChatMessage {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export enum EquipmentStatus {
  Operational = 'Operational',
  InMaintenance = 'InMaintenance',
  NeedsRepair = 'NeedsRepair',
  Decommissioned = 'Decommissioned',
}

export enum MaintenanceType {
  Preventive = 'Preventive',
  Corrective = 'Corrective',
  Predictive = 'Predictive',
  Rehabilitation = 'Rehabilitation',
}

export enum PreventiveMaintenanceSchedule {
    None = 'None',
    Monthly = 'Monthly',
    Bimonthly = 'Bimonthly',
    Trimonthly = 'Trimonthly',
    Semiannual = 'Semiannual',
    Annual = 'Annual',
}

export interface MaintenanceLog {
  date: string;
  description: string;
  type: MaintenanceType;
}

export interface ProjectFile {
    id: string;
    name: string;
    type: 'image' | 'pdf';
    data: string; // base64
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
  projectFiles: ProjectFile[];
}

export enum ServiceOrderStatus {
  Open = 'Open',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface ServiceOrder {
  id: string;
  equipmentId: string;
  type: MaintenanceType;
  status: ServiceOrderStatus;
  description: string;
  scheduledDate: string;
  assignedToTeamId?: string;
  openedDate?: string;
  closedDate?: string;
  maintenanceDuration?: number; // in hours
  rehabilitationCost?: number;
  photos?: string[];
  checklistExecutionId?: string;
  failureModeId?: string;
}

export interface ReplacementPart {
  id: string;
  equipmentId: string;
  name: string;
  code: string;
  stockQuantity: number;
  supplier?: string;
}

export enum PartnerType {
    Supplier = 'Supplier',
    ServiceProvider = 'Service Provider',
}

export interface ServiceCategory {
    id: string;
    name: string;
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
    serviceCategoryIds?: string[];
    notes?: string;
}

export enum ChecklistItemType {
    OK_NOT_OK = 'OK / NOT OK',
    NUMERIC = 'Numeric',
}

export interface ChecklistItem {
    id: string;
    text: string;
    type: ChecklistItemType;
    order: number;
    photo?: string;
}

export interface ChecklistTemplate {
    id: string;
    name: string;
    items: ChecklistItem[];
    type: 'equipment' | 'metrology';
}

export interface ChecklistResultItem {
    checklistItemId: string;
    status: 'OK' | 'NOT_OK' | null;
    value: string | number | null;
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

export interface FailureMode {
    id: string;
    name: string;
    description: string;
    equipmentType: string;
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
    requestDate: string;
    responseDate?: string;
    requesterUserId: string;
    items: QuoteItem[];
    attachments?: ProjectFile[];
    totalCost?: number;
    notes?: string;
}

export enum InstrumentStatus {
    Active = 'Active',
    InCalibration = 'In Calibration',
    Damaged = 'Damaged',
    Retired = 'Retired',
}

export interface CalibrationLog {
    id: string;
    date: string;
    technician: string;
    certificateNumber: string;
    result: 'Approved' | 'Rejected';
    notes?: string;
}

export interface MeasurementInstrument {
    id: string;
    name: string;
    model: string;
    manufacturer: string;
    serialNumber?: string;
    purchaseDate: string;
    status: InstrumentStatus;
    location: string;
    calibrationIntervalMonths: number;
    lastCalibrationDate?: string;
    nextCalibrationDate?: string;
    calibrationHistory: CalibrationLog[];
    checklistTemplateId?: string;
}

export interface PredictiveAnalysis {
  healthAnalysis: string;
  nextMaintenanceRecommendation: string;
  potentialRisks: string[];
}

export type NotificationType = 'calibration' | 'maintenance' | 'failure';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  link?: {
    view: View;
    focusId: string;
  };
}