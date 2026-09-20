export interface DriverAttachmentHistoryItem {
  id: string;
  driverId: string;
  operatorId: string | null;
  operatorName?: string | null;
  newFranchiseId: string | null;
  franchiseBodyNumber?: number | null;
  driverRole: string; // 'PRIMARY' | 'SECONDARY'
  action: string; // 'ATTACHED' | 'DETACHED' | 'REPLACED'
  attachedAt: Date | string;
  detachedAt: Date | string | null;
  remarks: string | null;
}

export interface DriverItem {
  id: string;
  driverId: string | null;
  firstName: string;
  lastName: string;
  middleName: string | null;
  licenseNo: string;
  licenseExpiryDate: Date | string | null;
  address: string;
  contactNo: string;
  email: string | null;
  dateOfBirth: Date | string;
  status: string; // 'ACTIVE' | 'SUSPENDED' | 'REVOKED'
  profilePicture: string | null;
  licenseFrontImage: string | null;
  licenseBackImage: string | null;
  operatorId: string | null;
  newFranchiseId: string | null;
  driverRole: "PRIMARY" | "SECONDARY" | null;
  assignedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  operator?: {
    id: string;
    operatorId: string;
    name: string;
    mobileNo: string;
    address: string;
  } | null;
  newFranchise?: {
    id: string;
    franchiseBodyNumber: number;
    zone: string | null;
    mtopVehicle?: {
      id: string;
      plateNumber: string;
      make: string;
      model: string;
    } | null;
  } | null;
  attachmentHistory?: DriverAttachmentHistoryItem[];
}

export interface DriverRegistrationInput {
  driverId?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  licenseNo: string;
  licenseExpiryDate?: string;
  address: string;
  contactNo: string;
  email?: string;
  dateOfBirth: string;
  status?: string;
  profilePicture?: string;
  licenseFrontImage?: string;
  licenseBackImage?: string;
  operatorId?: string | null;
  newFranchiseId?: string | null;
  driverRole?: "PRIMARY" | "SECONDARY" | null;
}

export interface DriverUpdateInput {
  firstName: string;
  lastName: string;
  middleName?: string;
  licenseNo: string;
  licenseExpiryDate?: string;
  address: string;
  contactNo: string;
  email?: string;
  dateOfBirth: string;
  status: string;
  profilePicture?: string;
  licenseFrontImage?: string;
  licenseBackImage?: string;
}

export interface DriverAttachInput {
  operatorId: string | null;
  newFranchiseId: string | null;
  driverRole: "PRIMARY" | "SECONDARY" | null;
  replaceExisting?: boolean;
}

export interface AssignedDriverSlotInfo {
  id: string;
  name: string;
  driverId: string | null;
  licenseNo: string;
  driverRole: "PRIMARY" | "SECONDARY";
}

export interface OperatorOptionForDriver {
  id: string;
  operatorId: string;
  name: string;
  mobileNo: string;
  address: string;
  newFranchise?: {
    id: string;
    franchiseBodyNumber: number;
  } | null;
  primaryDriver?: AssignedDriverSlotInfo | null;
  secondaryDriver?: AssignedDriverSlotInfo | null;
  driverCount: number;
  isFull: boolean;
}

export interface FranchiseOptionForDriver {
  id: string;
  franchiseBodyNumber: number;
  operatorId: string | null;
  operatorName?: string | null;
  zone: string | null;
  vehiclePlate?: string | null;
  primaryDriver?: AssignedDriverSlotInfo | null;
  secondaryDriver?: AssignedDriverSlotInfo | null;
  driverCount: number;
  isFull: boolean;
}

export interface DriverStatsData {
  total: number;
  active: number;
  primaryCount: number;
  secondaryCount: number;
  standalone: number;
}
