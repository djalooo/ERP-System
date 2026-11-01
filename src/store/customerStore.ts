import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface FeatureSettings {
    enableRewards: boolean;
    rewardMethod: 'purchases' | 'points';
    // Option 1
    purchasesRequiredForReward: number; 
    purchaseRewardValue: string;
    // Option 2
    amountRequiredForPoints: number; 
    pointsEarnedPerAmount: number;
    pointsRequiredForReward: number;
    pointsRewardValue: string;
}

export interface Customer {
    id: string;
    name: string;
    points: number;
    totalPurchases: number;
    totalSpent: number;
    balance: number; // Positive = Credit, Negative = Debt
    pendingVisits: number; // Visits from debt orders not yet counted
    createdAt: string;
    updatedAt: string;
}

export interface Redemption {
    id: string;
    customerId: string;
    customerName: string;
    type: 'points' | 'purchases';
    amount: number;
    rewardValue: string;
    createdAt: string;
}

interface CustomerStore {
    customers: Customer[];
    settings: FeatureSettings;
    redemptions: Redemption[];
    addCustomer: (name: string) => void;
    updateCustomer: (id: string, data: Partial<Customer>) => void;
    deleteCustomer: (id: string) => void;
    updateSettings: (settings: Partial<FeatureSettings>) => void;
    addPurchase: (customerId: string, amount: number, type: 'regular' | 'debt_order' | 'use_balance') => void;
    redeemPoints: (customerId: string) => void;
    redeemPurchases: (customerId: string) => void;
    updateBalance: (customerId: string, amount: number) => void; // amount can be positive (payment) or negative (debt/withdrawal)
}

export const useCustomerStore = create<CustomerStore>()(
    persist(
        (set) => ({
            customers: [],
            redemptions: [],
            settings: {
                enableRewards: true,
                rewardMethod: 'purchases',
                purchasesRequiredForReward: 6,
                purchaseRewardValue: 'Free Coffee',
                amountRequiredForPoints: 10,
                pointsEarnedPerAmount: 10,
                pointsRequiredForReward: 100,
                pointsRewardValue: 'Free Drink',
            },
            addCustomer: (name) => set((state) => {
                const newCustomer: Customer = {
                    id: Date.now().toString(),
                    name,
                    points: 0,
                    totalPurchases: 0,
                    totalSpent: 0,
                    balance: 0,
                    pendingVisits: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                return { customers: [...state.customers, newCustomer] };
            }),
            updateCustomer: (id, data) => set((state) => ({
                customers: state.customers.map(c =>
                    c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
                )
            })),
            deleteCustomer: (id) => set((state) => ({
                customers: state.customers.filter(c => c.id !== id)
            })),
            updateSettings: (newSettings) => set((state) => ({
                settings: { ...state.settings, ...newSettings }
            })),
            updateBalance: (customerId, amount) => set((state) => ({
                customers: state.customers.map(c => {
                    if (c.id === customerId) {
                        const { settings } = state;
                        let updated = { ...c, balance: (c.balance || 0) + amount, updatedAt: new Date().toISOString() };
                        
                        // Requirement: Award points for deposits (payment) immediately if points system is active
                        if (amount > 0 && settings.enableRewards && settings.rewardMethod === 'points') {
                            const pointsEarned = Math.floor(amount / (settings.amountRequiredForPoints || 10)) * settings.pointsEarnedPerAmount;
                            updated.points += pointsEarned;
                            updated.totalSpent += amount; // Record the spending during payment
                        }

                        // Requirement: Count VISITS after paying debt
                        if (amount > 0 && settings.enableRewards && settings.rewardMethod === 'purchases' && updated.pendingVisits > 0) {
                            const totalDebtBefore = Math.abs((c.balance || 0));
                            if (totalDebtBefore > 0) {
                                // Proportionally release visits based on payment
                                const visitsToRelease = Math.min(updated.pendingVisits, Math.floor((amount / totalDebtBefore) * updated.pendingVisits) || 1);
                                updated.totalPurchases += visitsToRelease;
                                updated.pendingVisits -= visitsToRelease;
                            }
                        }
                        
                        return updated;
                    }
                    return c;
                })
            })),
            addPurchase: (customerId, amount, type) => set((state) => ({
                customers: state.customers.map(c => {
                    if (c.id === customerId) {
                        const { settings } = state;
                        let updated = { ...c, balance: (c.balance || 0), updatedAt: new Date().toISOString() };
                        
                        // Handle Balance: Debt Order or Use Balance deduct from balance
                        if (type === 'debt_order' || type === 'use_balance') {
                            updated.balance -= amount;
                        }

                        // Requirement: Debt orders NOT included in Total Sales/Total Orders/Rewards
                        // BUT we track the "pending visit" to count it after payment
                        if (type === 'debt_order') {
                            updated.pendingVisits = (updated.pendingVisits || 0) + 1;
                            return updated;
                        }

                        // Handle Stats & Rewards for 'regular' or 'use_balance'
                        if (settings.enableRewards) {
                            if (settings.rewardMethod === 'purchases') {
                                updated.totalPurchases += 1;
                            } else if (settings.rewardMethod === 'points') {
                                const pointsEarned = Math.floor(amount / (settings.amountRequiredForPoints || 10)) * settings.pointsEarnedPerAmount;
                                updated.points += pointsEarned;
                                updated.totalSpent += amount;
                            }
                        } else {
                            updated.totalPurchases += 1;
                            updated.totalSpent += amount;
                        }
                        return updated;
                    }
                    return c;
                })
            })),
            redeemPoints: (customerId) => set((state) => {
                const customer = state.customers.find(c => c.id === customerId);
                if (!customer) return state;

                const pointsToRedeem = state.settings.pointsRequiredForReward;
                if (customer.points < pointsToRedeem) return state;

                const newRedemption: Redemption = {
                    id: Date.now().toString(),
                    customerId,
                    customerName: customer.name,
                    type: 'points',
                    amount: pointsToRedeem,
                    rewardValue: state.settings.pointsRewardValue,
                    createdAt: new Date().toISOString()
                };

                return {
                    customers: state.customers.map(c =>
                        c.id === customerId ? {
                            ...c,
                            points: c.points - pointsToRedeem,
                            updatedAt: new Date().toISOString()
                        } : c
                    ),
                    redemptions: [...state.redemptions, newRedemption]
                };
            }),
            redeemPurchases: (customerId) => set((state) => {
                const customer = state.customers.find(c => c.id === customerId);
                if (!customer) return state;

                const purchasesToRedeem = state.settings.purchasesRequiredForReward;
                if (customer.totalPurchases < purchasesToRedeem) return state;

                const newRedemption: Redemption = {
                    id: Date.now().toString(),
                    customerId,
                    customerName: customer.name,
                    type: 'purchases',
                    amount: purchasesToRedeem,
                    rewardValue: state.settings.purchaseRewardValue,
                    createdAt: new Date().toISOString()
                };

                return {
                    customers: state.customers.map(c =>
                        c.id === customerId ? {
                            ...c,
                            totalPurchases: c.totalPurchases - purchasesToRedeem,
                            updatedAt: new Date().toISOString()
                        } : c
                    ),
                    redemptions: [...state.redemptions, newRedemption]
                };
            }),
        }),
        {
            name: 'customer-storage',
            storage: createJSONStorage(() => localStorage), // Using localStorage for electron for now, as we use persistence elsewhere
        }
    )
);
