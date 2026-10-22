

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product, SelectedProduct, OrderItem, StaffMember, StaffRank, Order, OrderStatus, Client, PromoCode, User } from './types';
import type { UserRole } from '@/types';
import type { AskAgroGreekOutput } from '@/ai/flows/ask-agro-greek-flow'; 
import type { ExamineProductOutput } from '@/ai/flows/examine-product-types';
import { catalogDataString } from '@/ai/data/catalog-data';
import { parseProductsFromCatalog } from '@/lib/catalog-parser';
import { CATEGORIZED_PRODUCTION_TYPES, ALL_PRODUCTION_TYPES, type ProductionTypeCategory } from '@/config/production-types';
import { getAIRecommendations } from '@/actions/ai-actions';
import { promoCodes as initialPromoCodes } from '@/lib/promo-codes';
import { v4 as uuidv4 } from 'uuid';

export const MAX_QUERIES_GUEST = 3;
export const MAX_QUERIES_USER = 6;
export const MAX_QUERIES_ADMIN = 99999; // Effectively unlimited for admin

export interface QueryRecord {
  id: string;
  type: 'text' | 'image';
  timestamp: any; // Can be a Date or a Firestore Timestamp
  question?: string;
  imageDataUri?: string; // The full (but client-resized) image data URI. Persisted for history restoration.
  thumbnailDataUri?: string; // A small thumbnail for the history modal list view.
  response: AskAgroGreekOutput | ExamineProductOutput | { error: string };
  userId?: string; // Associate history with a user
}

const TRIAL_PERIOD_DAYS = 5;

const ranks: StaffRank[] = ['No Access', 'Staff', 'Management'];

export function calculateOrderMetrics(
    products: Product[],
    selectedProductIds: string[],
    doseSelections: { [productId: string]: 'low' | 'high' },
    areaSize: number
): { calculatedOrderItems: OrderItem[], orderSummaryText: string } {
    const items: OrderItem[] = selectedProductIds.map(id => {
        const product = products.find(p => p.id === id);
        if (!product) return null;

        let calculatedPackages = 0;
        let totalAmountNeeded: number | undefined = undefined;
        let amountUnit: 'g' | 'ml' | 'L' | 'kg' | undefined = undefined;

        const doseToUse = doseSelections[id] === 'low' ? product.doseLow : product.doseHigh;
        const isPerStremma = product.doseUnit && product.doseUnit.includes('στρέμμα');

        if (isPerStremma && areaSize > 0 && doseToUse && doseToUse > 0) {
            totalAmountNeeded = areaSize * doseToUse;
            const unitMatch = product.doseUnit?.match(/(g|ml|L|kg)/);
            amountUnit = unitMatch ? (unitMatch[0] as typeof amountUnit) : undefined;

            if (product.weightPerUnit && product.weightPerUnit > 0) {
                let amountInKgOrL = totalAmountNeeded;
                if (amountUnit === 'g' || amountUnit === 'ml') {
                    amountInKgOrL /= 1000;
                }
                calculatedPackages = Math.ceil(amountInKgOrL / product.weightPerUnit);
            }
        } else if (product.id) {
            calculatedPackages = 1;
        }

        const totalWeight = (product.weightPerUnit || 0) * calculatedPackages;

        return {
            productId: id,
            productName: product.name,
            calculatedPackages,
            unit: product.unit || 'Τεμάχια',
            totalWeight: totalWeight > 0 ? totalWeight : undefined,
            doseUsed: (product.doseLow != null && product.doseHigh != null && product.doseLow !== product.doseHigh) ? doseSelections[id] || 'high' : undefined,
            totalAmountNeeded,
            amountUnit,
        };
    }).filter((item): item is OrderItem => item !== null);

    let summary: string;
    if (items.length === 0) {
        summary = 'Επιλέξτε προϊόντα και ορίστε το μέγεθος της έκτασης για να δείτε τις λεπτομέρειες της παραγγελίας.';
    } else {
        summary = 'Σύνοψη Παραγγελίας:\n';
        items.forEach(item => {
            if (item.calculatedPackages > 0) {
                const weightText = item.totalWeight && item.totalWeight > 0 ? ` (${item.totalWeight.toLocaleString()} kg)` : '';
                summary += `- ${item.productName}: ${item.calculatedPackages} ${item.unit || 'Τεμάχια'}${weightText}\n`;
            } else if (item.totalAmountNeeded && item.amountUnit) {
                let amount = item.totalAmountNeeded;
                let unit: string = item.amountUnit;
                if (unit === 'ml' && amount >= 1000) { amount /= 1000; unit = 'L'; }
                else if (unit === 'g' && amount >= 1000) { amount /= 1000; unit = 'kg'; }
                summary += `- ${item.productName}: ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${unit}\n`;
            } else {
                summary += `- ${item.productName}: 1 Τεμάχιο (Μη υπολογίσιμη δόση)\n`;
            }
        });

        const totalPackages = items.reduce((sum, item) => sum + item.calculatedPackages, 0);
        const totalWeight = items.reduce((sum, item) => sum + (item.totalWeight || 0), 0);
        if (totalPackages > 0) summary += `\nΣύνολο Υπολογισμένων Συσκευασιών: ${totalPackages}`;
        if (totalWeight > 0) summary += `\nΣυνολικό Βάρος: ${totalWeight.toLocaleString()} kg`;
        if (areaSize <= 0 && items.some(item => products.find(p => p.id === item.productId)?.dose?.toLowerCase().includes('στρέμμα'))) {
            summary += '\n\n*Προσοχή: Ορίστε στρέμματα για σωστό υπολογισμό ποσοτήτων.';
        }
    }

    return { calculatedOrderItems: items, orderSummaryText: summary };
}

// Define the store's state and actions type for better type-safety
export interface AgroStoreState {
  // --- AUTH STATE (MERGED) ---
  user: User | null;
  isAuthenticated: boolean;
  queryCount: number;
  lastQueryDate: string | null;
  queryHistory: QueryRecord[];

  // --- UI & Form State (transient, not persisted) ---
  pathname: string;
  searchTerm: string;
  selectedCategory: string | null;
  selectedProductionType: string | null;
  areaSize: number;
  customerName: string;
  customerEmail: string;
  customerPhoneNumber: string;
  location: string;
  deliveryDate: Date | undefined;
  selectedProductsForOrder: string[];
  productDoseSelections: { [productId: string]: 'low' | 'high' };
  additionalOrderNotes: string;
  aiRecommendations: string[];
  isFetchingRecommendations: boolean;
  editingOrderId: string | null;
  isSavingOrder: boolean;
  currentOrderAudioUri: string | null;
  selectedQueryFromHistory: QueryRecord | null;

  // --- GLOBAL APP DATA (loaded from catalog or persisted in localStorage) ---
  products: Product[];
  isLoadingProducts: boolean;
  productLoadingError: string | null;
  staffMembers: StaffMember[];
  clients: Client[];
  companyLogoDataUri: string | null;
  savedOrders: Order[];
  isLoadingOrders: boolean;
  categorizedProductionTypes: ProductionTypeCategory[];
  allAvailableProductionTypes: string[];
  promoCodes: PromoCode[];
  
  // --- ACTIONS ---

  setPathname: (pathname: string) => void;
  // Auth Actions
  login: (user: User) => void;
  updateUserInStore: (profileData: Partial<User>) => void;
  logout: () => void;
  addDailyQueryCount: () => void;
  addQueryToHistory: (query: Omit<QueryRecord, 'id' | 'timestamp' | 'userId'>) => Promise<void>;
  setQueryHistory: (history: QueryRecord[]) => void; 
  hasReachedQueryLimit: () => boolean;
  deleteQueryFromHistory: (queryId: string) => Promise<void>; 

  // App Actions
  loadProducts: () => void;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setSelectedProductionType: (type: string | null) => void;
  setAreaSize: (size: number) => void;
  setCustomerName: (name: string) => void;
  setCustomerEmail: (email: string) => void;
  setCustomerPhoneNumber: (phone: string) => void;
  setLocation: (loc: string) => void;
  setDeliveryDate: (date: Date | undefined) => void;
  setAdditionalOrderNotes: (notes: string) => void;
  toggleProductSelection: (productId: string) => void;
  setProductDoseSelection: (productId: string, dose: 'low' | 'high') => void;
  ensureProductsSelected: (productIds: string[]) => void;
  fetchAIRecommendations: () => Promise<void>;
  saveCurrentOrder: () => Promise<boolean>;
  sendOrderToAgronomist: (agronomistId: string, agronomistName: string) => Promise<boolean>;
  clearOrderForm: () => void;
  clearLocalStore: () => void; 
  loadOrderForEditing: (order: Order) => void;
  loadOrderAsTemplate: (order: Order) => void;
  deleteOrder: (orderId: string) => void;
  markOrderAsCompleted: (orderId: string) => void;
  sendAnalysisToAgronomist: (analysisText: string, question: string, agronomist: { id: string, name: string }, imageDataUri?: string) => Promise<boolean>;
  acceptOrder: (orderId: string) => void;
  setSelectedQueryFromHistory: (query: QueryRecord | null) => void;
  
  setCompanyLogo: (uri: string | null) => void;
  addStaffMember: (newMember: Omit<StaffMember, 'id'>) => void;
  updateStaffMember: (updatedMember: StaffMember) => void;
  deleteStaffMember: (staffId: string) => void;
  promoteStaffMember: (staffId: string) => void;
  demoteStaffMember: (staffId: string) => void;

  updateUserProfile: (userId: string, profileData: Partial<Omit<User, 'id' | 'email'>>) => void;
  updateUserRole: (userId: string, newRole: UserRole, upgradeDate?: string) => void;
  grantLicensesToAgronomist: (agronomistId: string, licenseCount: number) => void;
  setAssociatedAgronomist: (agronomistId: string | null, farmerId: string) => void;

  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;
  
  setCurrentOrderAudioUri: (uri: string | null) => void;

  generatePromoCodes: (prefix: string, count: number) => string[];
  redeemLocalPromoCode: (code: string, userId: string, userEmail: string) => { success: boolean; error?: string };

  // Import / Export
  exportState: () => string;
  importState: (jsonString: string) => void;
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

export const useAgroStore = create<AgroStoreState>()(
  persist(
    (set, get) => ({
      // --- STATE ---
      // Auth State
      user: null,
      isAuthenticated: false,
      queryCount: 0,
      lastQueryDate: null,
      queryHistory: [],

      // UI & Form State
      pathname: '',
      searchTerm: '',
      selectedCategory: null,
      selectedProductionType: null,
      areaSize: 0,
      customerName: '',
      customerEmail: '',
      customerPhoneNumber: '',
      location: '',
      deliveryDate: undefined,
      selectedProductsForOrder: [],
      productDoseSelections: {},
      additionalOrderNotes: '',
      aiRecommendations: [],
      isFetchingRecommendations: false,
      editingOrderId: null,
      isSavingOrder: false,
      currentOrderAudioUri: null,
      selectedQueryFromHistory: null,
      
      // Global App Data
      products: [],
      isLoadingProducts: false,
      productLoadingError: null,
      staffMembers: [],
      clients: [],
      companyLogoDataUri: null,
      savedOrders: [],
      isLoadingOrders: false,
      categorizedProductionTypes: CATEGORIZED_PRODUCTION_TYPES,
      allAvailableProductionTypes: ALL_PRODUCTION_TYPES,
      promoCodes: initialPromoCodes,

      // --- ACTIONS ---

      setPathname: (pathname: string) => set({ pathname }),

      // Auth Actions
      login: (user) => set({ user, isAuthenticated: true }),
      updateUserInStore: (profileData) => {
        set(state => ({
            user: state.user ? { ...state.user, ...profileData } : null
        }));
      },
      logout: () => set({ user: null, isAuthenticated: false, queryHistory: [] }), // Clear history on logout
      setQueryHistory: (history) => set({ queryHistory: history }),
      addDailyQueryCount: () => {
        const { user } = get();
        if (!user) return; 

        const isAdmin = user.email?.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase();
        if (!isAdmin) {
            const today = getTodayDateString();
            const lastQueryDate = get().lastQueryDate;
            let currentQueryCount = (lastQueryDate === today) ? get().queryCount : 0;
            
            set({
              queryCount: currentQueryCount + 1,
              lastQueryDate: today,
            });
        }
      },
      addQueryToHistory: async (query) => {
        const { addDailyQueryCount, user } = get();
        addDailyQueryCount();
        const newRecord: QueryRecord = {
          ...query,
          id: uuidv4(),
          timestamp: new Date(),
          userId: user?.id,
        };
        set(state => ({ queryHistory: [newRecord, ...state.queryHistory] }));
      },
      hasReachedQueryLimit: () => {
        const { user, isAuthenticated, queryCount, lastQueryDate } = get();
        const isAdmin = isAuthenticated && user?.email?.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase();
        if (isAdmin) return false;
        
        const today = getTodayDateString();
        if (lastQueryDate !== today) {
          set({ queryCount: 0, lastQueryDate: today });
          return false;
        }
        
        let maxQueries;
        if (isAuthenticated && (user?.role === 'agronomist-premium' || user?.role === 'farmer-pro')) {
          maxQueries = MAX_QUERIES_ADMIN;
        } else if (isAuthenticated) {
          maxQueries = MAX_QUERIES_USER;
        } else {
          maxQueries = MAX_QUERIES_GUEST;
        }
        return queryCount >= maxQueries;
      },
      deleteQueryFromHistory: async (queryId) => {
         set(state => ({ queryHistory: state.queryHistory.filter(q => q.id !== queryId) }));
      },

      // App Actions
      loadProducts: () => {
        if (get().products.length > 0) return;
        set({ isLoadingProducts: true, productLoadingError: null });
        try {
          const parsedProducts = parseProductsFromCatalog(catalogDataString);
          set({ products: parsedProducts, isLoadingProducts: false });
        } catch (error: any) {
          set({ isLoadingProducts: false, productLoadingError: error.message || 'Failed to load products.' });
        }
      },
      
      setSearchTerm: (term) => set({ searchTerm: term }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setSelectedProductionType: (type) => set({ selectedProductionType: type }),
      setAreaSize: (size) => set({ areaSize: size }),
      setCustomerName: (name) => set({ customerName: name }),
      setCustomerEmail: (email) => set({ customerEmail: email }),
      setCustomerPhoneNumber: (phone) => set({ customerPhoneNumber: phone }),
      setLocation: (loc) => set({ location: loc }),
      setDeliveryDate: (date) => set({ deliveryDate: date }),
      setAdditionalOrderNotes: (notes) => set({ additionalOrderNotes: notes }),
      
      toggleProductSelection: (productId) => {
        set(state => ({
          selectedProductsForOrder: state.selectedProductsForOrder.includes(productId)
            ? state.selectedProductsForOrder.filter(id => id !== productId)
            : [...state.selectedProductsForOrder, productId]
        }));
      },
      
      setProductDoseSelection: (productId, dose) => {
        set(state => ({ productDoseSelections: { ...state.productDoseSelections, [productId]: dose } }));
      },

      ensureProductsSelected: (productIds) => {
        set(state => ({
          selectedProductsForOrder: Array.from(new Set([...state.selectedProductsForOrder, ...productIds]))
        }));
      },
      
      fetchAIRecommendations: async () => {
        set({ isFetchingRecommendations: true, aiRecommendations: [] });
        const { products, selectedProductsForOrder, productDoseSelections, areaSize, selectedProductionType } = get();
        const { calculatedOrderItems } = calculateOrderMetrics(products, selectedProductsForOrder, productDoseSelections, areaSize);
        const items = calculatedOrderItems.filter(item => item.calculatedPackages > 0 || item.totalAmountNeeded);

        if (items.length === 0) {
            set({ isFetchingRecommendations: false, aiRecommendations: ["Δεν έχουν επιλεχθεί προϊόντα για να δοθούν προτάσεις."] });
            return;
        }

        const selectedProductsText = items.map(item => `- ${item.productName}`).join('\n');
        
        const result = await getAIRecommendations({
            selectedProductsText,
            productionType: selectedProductionType || undefined,
            catalogData: catalogDataString,
        });

        if ('error' in result) {
            set({ isFetchingRecommendations: false, aiRecommendations: [`Σφάλμα: ${result.error}`] });
        } else {
            set({ isFetchingRecommendations: false, aiRecommendations: result.recommendations });
        }
      },

      saveCurrentOrder: async () => {
        set({ isSavingOrder: true });
        const { editingOrderId, customerName, customerEmail, customerPhoneNumber, location, areaSize, deliveryDate, products, selectedProductsForOrder, productDoseSelections, additionalOrderNotes, aiRecommendations, clearOrderForm, currentOrderAudioUri, user } = get();
        if (!user) {
            set({ isSavingOrder: false });
            return false;
        }

        const { calculatedOrderItems } = calculateOrderMetrics(products, selectedProductsForOrder, productDoseSelections, areaSize);
        const createdByName = user.name || "Demo User";
        const items = calculatedOrderItems.filter(item => item.calculatedPackages > 0 || item.totalAmountNeeded);
      
        if (items.length === 0) {
          set({ isSavingOrder: false });
          return false;
        }
        
        try {
          if (editingOrderId) {
            const updatedOrder = {
              id: editingOrderId,
              customerName, customerEmail, customerPhoneNumber, location, areaSize,
              deliveryDate: deliveryDate?.getTime(),
              items,
              totalCalculatedPackages: items.reduce((sum, item) => sum + item.calculatedPackages, 0),
              totalWeight: items.reduce((sum, item) => sum + (item.totalWeight || 0), 0) || undefined,
              additionalOrderNotes, aiRecommendations, audioDataUri: currentOrderAudioUri,
            };
            set(state => ({
              savedOrders: state.savedOrders.map(o => o.id === editingOrderId ? { ...o, ...updatedOrder } : o)
            }));
          } else {
            const newOrder: Order = {
                id: uuidv4(), createdAt: new Date().getTime(), customerName, customerEmail, customerPhoneNumber, location, areaSize,
                deliveryDate: deliveryDate?.getTime(),
                items,
                totalCalculatedPackages: items.reduce((sum, item) => sum + item.calculatedPackages, 0),
                totalWeight: items.reduce((sum, item) => sum + (item.totalWeight || 0), 0) || undefined,
                additionalOrderNotes, aiRecommendations, createdBy: user.id, createdByName, status: 'Pending',
                producerId: user.id, audioDataUri: currentOrderAudioUri,
            };
            set(state => ({ savedOrders: [newOrder, ...state.savedOrders] }));
          }
          clearOrderForm();
          return true;
        } catch (e) {
          console.error("Error saving order: ", e);
          return false;
        } finally {
          set({ isSavingOrder: false });
        }
      },
      
      clearLocalStore: () => {
          get().logout();
          set({ 
              queryHistory: [], staffMembers: [], clients: [], companyLogoDataUri: null, 
              savedOrders: [], promoCodes: initialPromoCodes 
          });
      },

      clearOrderForm: () => {
        set({
            searchTerm: '', selectedCategory: null, selectedProductionType: null, areaSize: 0, customerName: '',
            customerEmail: '', customerPhoneNumber: '', location: '', deliveryDate: undefined, selectedProductsForOrder: [],
            productDoseSelections: {}, additionalOrderNotes: '', aiRecommendations: [], editingOrderId: null, currentOrderAudioUri: null,
        });
      },
      
      updateUserProfile: (userId, profileData) => {
        set(state => {
            if (state.user && state.user.id === userId) {
                return { user: { ...state.user, ...profileData } };
            }
            return state;
        });
      },
      
      updateUserRole: (userId, newRole, upgradeDate) => {
         set(state => {
            if (state.user && state.user.id === userId) {
                const userUpdate: Partial<User> = { role: newRole };
                if (upgradeDate) {
                  userUpdate.roleUpgradeDate = upgradeDate;
                }
                return { user: { ...state.user, ...userUpdate } };
            }
            return state;
        });
      },

      addClient: (newClient) => {
        const id = uuidv4();
        set(state => ({ clients: [...state.clients, { ...newClient, id }] }));
      },
      updateClient: (updatedClient) => {
        set(state => ({
            clients: state.clients.map(c => c.id === updatedClient.id ? updatedClient : c)
        }));
      },
      deleteClient: (clientId) => {
        set(state => ({ clients: state.clients.filter(c => c.id !== clientId) }));
      },

      addStaffMember: (newMember) => {
        const id = uuidv4();
        const trialStartDate = newMember.rank === 'Management' ? new Date().toISOString() : undefined;
        set(state => ({ staffMembers: [...state.staffMembers, { ...newMember, id, trialStartDate }] }));
      },
      updateStaffMember: (updatedMember) => {
        set(state => ({
            staffMembers: state.staffMembers.map(m => m.id === updatedMember.id ? updatedMember : m)
        }));
      },
      deleteStaffMember: (staffId) => {
        set(state => ({ staffMembers: state.staffMembers.filter(m => m.id !== staffId) }));
      },

      setCompanyLogo: (uri) => {
        set(state => ({ companyLogoDataUri: uri }));
      },

      sendOrderToAgronomist: async (agronomistId, agronomistName) => {
          const success = await get().saveCurrentOrder();
          if (success) {
            // In a real app, this would trigger a notification to the agronomist.
            // For now, we just save the order.
          }
          return success; 
      },
      deleteOrder: (orderId) => {
        set(state => ({ savedOrders: state.savedOrders.filter(o => o.id !== orderId) }));
      },
      markOrderAsCompleted: (orderId) => {
        const { user } = get();
        set(state => ({
            savedOrders: state.savedOrders.map(o => o.id === orderId ? { 
                ...o, 
                status: 'Completed', 
                completedAt: new Date().getTime(),
                completedByName: user?.name || user?.email,
            } : o)
        }));
      },
      sendAnalysisToAgronomist: async (analysisText, question, agronomist, imageDataUri) => { 
        const { user } = get();
        if (!user) return false;

        const { products, selectedProductsForOrder, productDoseSelections, areaSize } = get();
        const { calculatedOrderItems } = calculateOrderMetrics(products, selectedProductsForOrder, productDoseSelections, areaSize);

        const newHelpRequest: Order = {
            id: uuidv4(),
            createdAt: new Date().getTime(),
            customerName: user.name || 'Unknown',
            customerPhoneNumber: user.phone || 'N/A',
            location: user.address || 'N/A',
            areaSize: user.areaSize || 0,
            items: calculatedOrderItems,
            totalCalculatedPackages: 0,
            additionalOrderNotes: `Ερώτηση Χρήστη: ${question}`,
            aiRecommendations: [],
            createdBy: user.id,
            createdByName: user.name || user.email,
            status: 'Help Request',
            aiAnalysis: analysisText,
            producerId: user.id,
            agronomistId: agronomist.id,
            agronomistName: agronomist.name,
            imageDataUri: imageDataUri,
        };
        set(state => ({ savedOrders: [newHelpRequest, ...state.savedOrders] }));
        return true;
      },
      acceptOrder: (orderId) => {
        set(state => ({
            savedOrders: state.savedOrders.map(o => o.id === orderId ? { ...o, status: 'Collecting and Shipping' } : o)
        }));
      },
      promoteStaffMember: (staffId) => {
        const { staffMembers } = get();
        const member = staffMembers.find(m => m.id === staffId);
        if(!member) return;
        const currentIndex = ranks.indexOf(member.rank);
        if (currentIndex < ranks.length - 1) {
            const newRank = ranks[currentIndex + 1];
            const trialStartDate = newRank === 'Management' && !member.trialStartDate ? new Date().toISOString() : member.trialStartDate;
            get().updateStaffMember({ ...member, rank: newRank, trialStartDate: trialStartDate });
        }
      },
      demoteStaffMember: (staffId) => {
        const { staffMembers } = get();
        const member = staffMembers.find(m => m.id === staffId);
        if(!member) return;
        const currentIndex = ranks.indexOf(member.rank);
        if (currentIndex > 0) {
            get().updateStaffMember({ ...member, rank: ranks[currentIndex - 1] });
        }
      },
      grantLicensesToAgronomist: (agronomistId, licenseCount) => {
          set(state => ({
              staffMembers: state.staffMembers.map(m =>
                  m.id === agronomistId ? { ...m, proLicenseCount: licenseCount } : m
              )
          }));
      },
      setAssociatedAgronomist: (agronomistId, farmerId) => {
        set(state => {
            const user = state.user;
            if (user && user.id === farmerId) {
                return { user: { ...user, associatedAgronomistId: agronomistId || undefined } };
            }
            return {};
        });
      },
      setCurrentOrderAudioUri: (uri) => set({ currentOrderAudioUri: uri }),
      generatePromoCodes: (prefix, count) => {
        const newCodes = Array.from({ length: count }, () => {
          const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
          return `${prefix.toUpperCase()}-${randomPart}`;
        });
    
        const newPromoCodeObjects: PromoCode[] = newCodes.map(code => ({
          code,
          redeemed: false,
        }));
    
        set(state => ({ promoCodes: [...state.promoCodes, ...newPromoCodeObjects] }));
        return newCodes;
      },
      
      redeemLocalPromoCode: (code, userId, userEmail) => {
        const { promoCodes } = get();
        const promo = promoCodes.find(p => p.code === code);
    
        if (!promo) {
          return { success: false, error: 'Invalid promo code.' };
        }
        if (promo.redeemed) {
          return { success: false, error: 'This promo code has already been used.' };
        }
    
        const updatedPromo = { ...promo, redeemed: true, redeemedBy: `${userEmail} (${userId})`, redeemedAt: new Date().toISOString() };
        set(state => ({
          promoCodes: state.promoCodes.map(p => p.code === code ? updatedPromo : p),
        }));
        
        return { success: true };
      },

      loadOrderForEditing: (order) => {
        set({
            editingOrderId: order.id,
            customerName: order.customerName,
            customerEmail: order.customerEmail || '',
            customerPhoneNumber: order.customerPhoneNumber || '',
            location: order.location || '',
            areaSize: order.areaSize,
            deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : undefined,
            selectedProductsForOrder: order.items.map(item => item.productId),
            productDoseSelections: order.items.reduce((acc, item) => {
                if (item.doseUsed) acc[item.productId] = item.doseUsed;
                return acc;
            }, {} as { [productId: string]: 'low' | 'high' }),
            additionalOrderNotes: order.additionalOrderNotes || '',
            aiRecommendations: order.aiRecommendations || [],
            currentOrderAudioUri: order.audioDataUri || null,
        });
      },
      loadOrderAsTemplate: (order) => {
        get().clearOrderForm();
        set({
            customerName: order.customerName,
            customerEmail: order.customerEmail || '',
            customerPhoneNumber: order.customerPhoneNumber || '',
            location: order.location || '',
            areaSize: order.areaSize,
            selectedProductsForOrder: order.items.map(item => item.productId),
            productDoseSelections: order.items.reduce((acc, item) => {
                if (item.doseUsed) acc[item.productId] = item.doseUsed;
                return acc;
            }, {} as { [productId: string]: 'low' | 'high' }),
        });
      },
      setSelectedQueryFromHistory: (query) => set({ selectedQueryFromHistory: query }),

      exportState: () => {
        const { user, queryHistory, staffMembers, clients, savedOrders, promoCodes, companyLogoDataUri } = get();
        const stateToExport = {
          user,
          queryHistory,
          staffMembers,
          clients,
          savedOrders,
          promoCodes,
          companyLogoDataUri
        };
        return JSON.stringify(stateToExport, null, 2);
      },

      importState: (jsonString) => {
        const stateToImport = JSON.parse(jsonString);
        // Add basic validation if needed
        set(state => ({
            ...state,
            ...stateToImport,
            isAuthenticated: !!stateToImport.user, // Ensure auth status is correct
        }));
      },
    }),
    {
      name: 'agro-store', 
      storage: createJSONStorage(() => localStorage), 
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        queryCount: state.queryCount,
        lastQueryDate: state.lastQueryDate,
        queryHistory: state.queryHistory,
        staffMembers: state.staffMembers,
        clients: state.clients,
        companyLogoDataUri: state.companyLogoDataUri,
        savedOrders: state.savedOrders,
        promoCodes: state.promoCodes,
      }),
    }
  )
);
