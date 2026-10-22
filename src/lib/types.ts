

import type { UserRole } from '@/types';

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  weightPerUnit?: number;
  activeIngredient?: string;
  manufacturer?: string;
  suitableForProduction: string[];
  notes?: string;
  dose?: string; // The original text, e.g., "50-75 ml / στρέμμα"
  doseLow?: number;
  doseHigh?: number;
  doseUnit?: string; // The unit part, e.g. "ml / στρέμμα"
  priceIndication?: string; // e.g., "€60 / L"
  priceValue?: number;
  priceUnit?: string;
}

export interface SelectedProduct extends Product {
  isSelected: boolean;
  calculatedPackages: number;
  doseSelection: 'low' | 'high';
  calculatedAmount?: number;
  calculatedAmountUnit?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  calculatedPackages: number;
  unit: string;
  totalWeight?: number;
  doseUsed?: 'low' | 'high';
  totalAmountNeeded?: number; // e.g. 2500
  amountUnit?: 'g' | 'ml' | 'L' | 'kg'; // The unit of the total amount
}

export interface QuickSetItemConfig {
  id: string;
  categoryDisplayName: string;
  productCategoryFilter: string;
  productSuitableForProductionFilter?: string;
  productManufacturerFilter?: string;
  defaultProductId?: string;
}

export interface QuickSet {
  id: string;
  name: string;
  description: string;
  items: QuickSetItemConfig[];
}

export type QuickSetSelections = {
  [key: string]: string;
};

export type StaffRank = 'Staff' | 'Management' | 'No Access';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  rank: StaffRank;
  trialStartDate?: string;
}

export type OrderStatus = 'Pending' | 'Completed' | 'Help Request' | 'Awaiting Producer Approval' | 'Collecting and Shipping';

export interface Order {
  id: string;
  createdAt: number;
  deliveryDate?: number;
  customerName: string;
  customerEmail?: string;
  customerPhoneNumber: string;
  location: string;
  areaSize: number;
  items: OrderItem[];
  totalCalculatedPackages: number;
  totalWeight?: number;
  additionalOrderNotes: string;
  aiRecommendations: string[];
  createdBy: string; // User ID
  createdByName: string; // User Name
  status: OrderStatus;
  completedAt?: number;
  completedByName?: string;
  aiAnalysis?: string; // New field for AI analysis text
  producerId?: string; // The producer this order is for, or who requested help
  agronomistId?: string; // ID of the agronomist this request was sent to
  agronomistName?: string; // Name of the agronomist for display
  audioDataUri?: string;
  imageDataUri?: string; // For saving the image with the help request
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  areaSize?: number;
  productionTypes?: string[];
}

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  areaSize?: number;
  productionTypes?: string[];
  roleUpgradeDate?: string;
  photoURL?: string;
  // Agronomist specific
  proLicenseCount?: number; // How many Pro licenses an agronomist can grant
  grantedProFarmerIds?: string[]; // IDs of farmers they have upgraded
  // Farmer specific
  upgradedByAgronomistId?: string; // Which agronomist provided the Pro upgrade
}

export interface PromoCode {
  code: string;
  redeemed: boolean;
  redeemedBy?: string; // email (id)
  redeemedAt?: string; // ISO date string
}
