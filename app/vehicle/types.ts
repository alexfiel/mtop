export interface MTOPVehicleInput {
  registeredOwnerName: string;
  registeredAddress: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  engineNumber: string;
  chassisNumber: string;
  color: string;
  registrationNumber: string;
  operatorId?: string;
  userId?: string;
  vehicleImage?: string | null;
  ltoCrDocument?: string | null;
  ltoOrDocument?: string | null;
}

export interface OperatorOption {
  id: string;
  name: string;
  operatorId: string;
  address?: string | null;
  mobileNo?: string | null;
}

export interface VehicleItem {
  id: string;
  registeredOwnerName: string;
  registeredAddress: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  engineNumber: string;
  chassisNumber: string;
  color: string;
  registrationNumber: string;
  operatorId: string;
  vehicleImage?: string | null;
  ltoCrDocument?: string | null;
  ltoOrDocument?: string | null;
  operator?: {
    id: string;
    operatorId: string;
    name: string;
    address: string;
    mobileNo: string;
    email?: string | null;
    status?: string;
    isVerified?: boolean;
    newFranchise?: {
      id: string;
      franchiseBodyNumber: number;
      zone?: string | null;
      isActive: boolean;
      remarks?: string | null;
    } | null;
  } | null;
  newFranchise?: {
    id: string;
    franchiseBodyNumber: number;
    zone?: string | null;
    isActive: boolean;
    remarks?: string | null;
  } | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface VehicleUpdateInput {
  registeredOwnerName?: string;
  registeredAddress?: string;
  make?: string;
  model?: string;
  year?: number;
  plateNumber?: string;
  engineNumber?: string;
  chassisNumber?: string;
  color?: string;
  registrationNumber?: string;
  vehicleImage?: string | null;
  ltoCrDocument?: string | null;
  ltoOrDocument?: string | null;
}
