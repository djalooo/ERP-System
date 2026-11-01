import React, { useState, useMemo } from 'react';
import { useCustomerStore, Customer } from '@/store/customerStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, isThisMonth, subMonths, isAfter } from 'date-fns';
import {
    Users, Gift, Award, Plus, Edit, Eye, Trash2,
    Settings as SettingsIcon, Crown, ArrowLeft, ShoppingBag, DollarSign, Wallet
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { managedOrderStorage as orderStorage } from '@/lib/managedStorage';

export default function CustomerManagement() {
    const {
        customers,
        settings,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        updateSettings,
        redeemPoints,
        redeemPurchases,
        redemptions
    } = useCustomerStore();

    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // View Details Mode
    const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
    const [rewardMode, setRewardMode] = useState<'amount' | 'purchase'>('amount');

    // Dynamic customer lookup to prevent stale state
    const currentViewCustomer = viewCustomer ? customers.find(c => c.id === viewCustomer.id) || viewCustomer : null;

    const [formData, setFormData] = useState({ name: '' });

    // Load orders only when viewing customer
    const allOrders = orderStorage.getAll();

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const name = formData.name.trim();
        if (!name) return;

        // Check for duplicate name
        if (customers.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            alert("A customer with this name already exists.");
            return;
        }

        addCustomer(name);
        setFormData({ name: '' });
        setShowAddDialog(false);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const name = formData.name.trim();
        if (!selectedCustomer || !name) return;

        // Check for duplicate name (excluding self)
        if (customers.some(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== selectedCustomer.id)) {
            alert("A customer with this name already exists.");
            return;
        }

        updateCustomer(selectedCustomer.id, { name });
        setShowEditDialog(false);
        setSelectedCustomer(null);
    };

    const oneMonthAgo = subMonths(new Date(), 1);

    // Calculate Most Active (Last Month) based on orders
    const lastMonthOrders = allOrders.filter(o => isAfter(new Date(o.createdAt), oneMonthAgo));
    const customerActivity = useMemo(() => {
        const activityMap: Record<string, number> = {};
        lastMonthOrders.forEach(order => {
            if (order.customerName && order.customerName !== 'Anonymous Customer') {
                activityMap[order.customerName] = (activityMap[order.customerName] || 0) + order.totalAmount;
            }
        });
        return Object.entries(activityMap)
            .map(([name, totalSpent]) => ({ name, totalSpent }))
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 3);
    }, [lastMonthOrders]);

    // Calculate Rewards Redeemed (Last Month)
    const rewardsRedeemedCount = redemptions.filter(r => isAfter(new Date(r.createdAt), oneMonthAgo)).length;

    // Single source of truth: compute per-customer balances from orders
    // This is orders-based so it is always accurate regardless of store state
    const customerBalanceMap = useMemo(() => {
        const map: Record<string, number> = {};
        const orders = orderStorage.getAll();
        orders.forEach(o => {
            if (o.type !== 'bank') return;
            const name = (o.customerName || '').toLowerCase().trim();
            if (!name) return;
            map[name] = map[name] ?? 0;
            if (o.bankAction === 'payment') map[name] += o.totalAmount;
            else if (o.bankAction === 'debt') map[name] -= o.totalAmount;
            else if (o.bankAction === 'use_balance') map[name] -= o.totalAmount;
        });
        return map;
    }, [allOrders]);

    // Total Bank Balance = aggregate of all per-customer balances
    const totalBalanceStats = useMemo(() => {
        let net = 0;
        let credit = 0;
        let debt = 0;
        Object.values(customerBalanceMap).forEach(bal => {
            net += bal;
            if (bal > 0) credit += bal;
            if (bal < 0) debt += Math.abs(bal);
        });
        return { net, credit, debt };
    }, [customerBalanceMap]);

    if (viewCustomer) {
        const customerOrders = allOrders
            .filter(o => o.customerName && o.customerName.toLowerCase() === currentViewCustomer.name.toLowerCase())
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 12);

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setViewCustomer(null)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold">{currentViewCustomer.name}</h2>
                        <p className="text-sm text-gray-500">Customer Details & Rewards</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-white shadow-sm border-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                {settings.rewardMethod === 'points' ? 'Total Spent' : 'Total Purchases'}
                            </CardTitle>
                            <ShoppingBag className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {settings.rewardMethod === 'points' ? `$${(currentViewCustomer.totalSpent || 0).toFixed(2)}` : currentViewCustomer.totalPurchases}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {settings.rewardMethod === 'points' ? 'Lifetime expenditure' : `Visit rewards: ${Math.floor(currentViewCustomer.totalPurchases / (settings.purchasesRequiredForReward || 1))}`}
                                {settings.rewardMethod === 'purchases' && (currentViewCustomer.pendingVisits || 0) > 0 && (
                                    <span className="block text-amber-600 font-bold mt-1 text-[10px]">
                                        Pending: {currentViewCustomer.pendingVisits} Unpaid Visits
                                    </span>
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-sm border-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Available Points</CardTitle>
                            <Crown className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{currentViewCustomer.points} pts</div>
                            <p className="text-xs text-muted-foreground mt-1">Rewards: {Math.floor(currentViewCustomer.points / settings.pointsRequiredForReward)}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-sm border-none col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Bank Balance (Credit/Debt)</CardTitle>
                            <Wallet className={`h-4 w-4 ${(customerBalanceMap[currentViewCustomer.name.toLowerCase().trim()] ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${(customerBalanceMap[currentViewCustomer.name.toLowerCase().trim()] ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${(customerBalanceMap[currentViewCustomer.name.toLowerCase().trim()] ?? 0).toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {(customerBalanceMap[currentViewCustomer.name.toLowerCase().trim()] ?? 0) >= 0 ? 'Customer Credit' : 'Customer Debt'}
                            </p>
                        </CardContent>
                    </Card>
                </div>



                <Card>
                    <CardHeader>
                        <CardTitle>Recent Orders Panel</CardTitle>
                        <CardDescription>Last 12 orders for this customer</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {customerOrders.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No recent orders found matching name.</p>
                        ) : (
                            <div className="space-y-4">
                                {customerOrders.map(order => (
                                    <div key={order.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                                        <div>
                                            <p className="font-medium text-sm">Order #{order.id}</p>
                                            <p className="text-xs text-gray-500">{format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                                        </div>
                                        <div className="font-bold text-primary">${order.totalAmount.toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div >
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-primary-800 mb-2">Customer Management</h2>
                    <p className="text-gray-600">Manage customers and loyalty rewards</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
                        <SettingsIcon className="w-4 h-4 mr-2" />
                        Reward Settings
                    </Button>
                    <Button onClick={() => setShowAddDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Customer
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white shadow-sm border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Customers</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{customers.length}</p>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Most Active (30d)</p>
                                {customerActivity.length > 0 ? (
                                    <div className="mt-1">
                                        <p className="text-lg font-bold text-gray-900 line-clamp-1">{customerActivity[0].name}</p>
                                        <p className="text-xs text-gray-500 font-medium">${customerActivity[0].totalSpent.toFixed(2)}</p>
                                    </div>
                                ) : (
                                    <p className="text-2xl font-bold text-gray-300 mt-1">N/A</p>
                                )}
                            </div>
                            <div className="p-3 rounded-full bg-amber-100">
                                <Crown className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rewards (30d)</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{rewardsRedeemedCount}</p>
                            </div>
                            <div className="p-3 rounded-full bg-green-100">
                                <Gift className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-none">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Bank Balance</p>
                                <p className={`text-2xl font-bold mt-1 ${totalBalanceStats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${totalBalanceStats.net.toFixed(2)}
                                </p>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-green-500">Credit: ${totalBalanceStats.credit.toFixed(0)}</span>
                                    <span className="text-[10px] font-bold text-red-500">Debt: ${totalBalanceStats.debt.toFixed(0)}</span>
                                </div>
                            </div>
                            <div className={`p-3 rounded-full ${totalBalanceStats.net >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                <Wallet className={`h-6 w-6 ${totalBalanceStats.net >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Customer Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-left">Name</TableHead>
                                <TableHead className="text-center">Redeemed Rewards</TableHead>
                                <TableHead className="text-center">Points</TableHead>
                                <TableHead className="text-center">Balance</TableHead>
                                <TableHead className="text-center">Date Added</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No customers found</TableCell>
                                </TableRow>
                            ) : (
                                customers.map(customer => {
                                    const customerRedemptions = redemptions.filter(r => r.customerId === customer.id).length;
                                    return (
                                        <TableRow key={customer.id}>
                                            <TableCell className="font-medium text-left">{customer.name}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">
                                                    {customerRedemptions}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-yellow-600">{customer.points}</TableCell>
                                            <TableCell className={`text-center font-bold ${(customerBalanceMap[customer.name.toLowerCase().trim()] ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                ${(customerBalanceMap[customer.name.toLowerCase().trim()] ?? 0).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-center">{format(new Date(customer.createdAt), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell className="text-center space-x-2">
                                                <Button variant="outline" size="icon" onClick={() => setViewCustomer(customer)}>
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button variant="outline" size="icon" onClick={() => {
                                                    setSelectedCustomer(customer);
                                                    setFormData({ name: customer.name });
                                                    setShowEditDialog(true);
                                                }}>
                                                    <Edit className="w-4 h-4 text-blue-600" />
                                                </Button>
                                                <Button variant="outline" size="icon" onClick={() => deleteCustomer(customer.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add Customer Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                        <DialogDescription>Enter the customer's name to add them to the system.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Customer Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter customer name"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Customer Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Customer</DialogTitle>
                        <DialogDescription>Modify the customer's name and details.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Customer Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                            <Button type="submit">Update</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Reward Settings</DialogTitle>
                        <DialogDescription>Configure how your customers earn and spend reward points.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Enable Rewards System</Label>
                                <p className="text-sm text-muted-foreground">Turn on to allow customers to earn rewards.</p>
                            </div>
                            <Switch
                                checked={settings.enableRewards}
                                onCheckedChange={(checked) => updateSettings({ enableRewards: checked })}
                            />
                        </div>

                        {settings.enableRewards && (
                            <div className="space-y-4">
                                <Label className="text-base font-semibold">Reward Method</Label>
                                <RadioGroup
                                    value={settings.rewardMethod}
                                    onValueChange={(value) => updateSettings({ rewardMethod: value as 'purchases' | 'points' })}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="purchases" id="r-purchases" />
                                        <Label htmlFor="r-purchases">Option 1: Reward after number of purchases</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="points" id="r-points" />
                                        <Label htmlFor="r-points">Option 2: Amount-based (Points system)</Label>
                                    </div>
                                </RadioGroup>

                                {settings.rewardMethod === 'purchases' && (
                                    <div className="space-y-4 pl-6 mt-4 border-l-2 border-primary-100">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Purchases Required</Label>
                                                <Input
                                                    type="number"
                                                    value={settings.purchasesRequiredForReward}
                                                    onChange={(e) => updateSettings({ purchasesRequiredForReward: Number(e.target.value) || 1 })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Reward Value</Label>
                                                <Input
                                                    value={settings.purchaseRewardValue}
                                                    onChange={(e) => updateSettings({ purchaseRewardValue: e.target.value })}
                                                    placeholder="e.g. Free Coffee"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Customers receive this reward after the required number of purchases.</p>
                                    </div>
                                )}

                                {settings.rewardMethod === 'points' && (
                                    <div className="space-y-4 pl-6 mt-4 border-l-2 border-primary-100">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Amount Required</Label>
                                                <Input
                                                    type="number"
                                                    value={settings.amountRequiredForPoints}
                                                    onChange={(e) => updateSettings({ amountRequiredForPoints: Number(e.target.value) || 1 })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Points Earned</Label>
                                                <Input
                                                    type="number"
                                                    value={settings.pointsEarnedPerAmount}
                                                    onChange={(e) => updateSettings({ pointsEarnedPerAmount: Number(e.target.value) || 1 })}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Earn {settings.pointsEarnedPerAmount} points for every ${settings.amountRequiredForPoints} spent.</p>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                            <div className="space-y-2">
                                                <Label>Points Needed For Reward</Label>
                                                <Input
                                                    type="number"
                                                    value={settings.pointsRequiredForReward}
                                                    onChange={(e) => updateSettings({ pointsRequiredForReward: Number(e.target.value) || 1 })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Reward Value</Label>
                                                <Input
                                                    value={settings.pointsRewardValue}
                                                    onChange={(e) => updateSettings({ pointsRewardValue: e.target.value })}
                                                    placeholder="e.g. Free Drink"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Customers can redeem their points for this reward.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
