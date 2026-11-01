import { createContext } from 'react';

export type Language = 'en' | 'ar' | 'fr';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

export const translations = {
  en: {
    // Navigation
    back: 'Back',
    dashboard: 'Dashboard',
    orders: 'Orders',
    products: 'Products',
    providers: 'Providers',
    employees: 'Employees',
    bills: 'Bills',
    returns: 'Returns',
    reports: 'Reports',
    settings: 'Settings',
    unknownProducts: 'Unknown Products',
    
    // Common
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    close: 'Close',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    time: 'Time',
    quantity: 'Quantity',
    price: 'Price',
    total: 'Total',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    
    // Dashboard
    totalSales: 'Total sales',
    totalOrders: 'Total orders',
    totalProducts: 'Total products',
    totalReturns: 'Total returns',
    profits: 'Profits',
    topProducts: 'Top products',
    topReturns: 'Top returns',
    recentOrders: 'Recent orders',
    bestSellingProducts: 'Best selling products',
    topReturnedProducts: 'Top returned products',
    
    // Orders
    orderHistory: 'Order history',
    customerName: 'Customer name',
    orderNumber: 'Order number',
    orderStatus: 'Order status',
    orderDate: 'Order date',
    orderTotal: 'Order total',
    amountPaid: 'Amount paid',
    remainingAmount: 'Remaining amount',
    completeOrder: 'Complete order',
    cancelOrder: 'Cancel order',
    newOrder: 'New order',
    noOrdersFound: 'No orders found',
    
    // Products
    productName: 'Product name',
    serialNumber: 'Serial number',
    purchasePrice: 'Purchase price',
    salePrice: 'Sale price',
    productManagement: 'Product Management',
    manageStoreProducts: 'Manage store products',
    addProduct: 'Add product',
    editProduct: 'Edit product',
    deleteProduct: 'Delete product',
    productSaveError: 'Error saving product',
    confirmDelete: 'Are you sure you want to delete this item?',
    searchProducts: 'Search products...',
    
    // Returns
    returnProduct: 'Return product',
    returnManagement: 'Return Management',
    addReturn: 'Add return',
    editReturn: 'Edit return',
    returnStatus: 'Return status',
    returnReason: 'Return reason',
    returnNotes: 'Return notes',
    returnAmount: 'Return amount',
    returnDetails: 'Return details',
    returnInformation: 'Return information',
    returnDate: 'Return date',
    pendingReturns: 'Pending returns',
    approvedReturns: 'Approved returns',
    rejectedReturns: 'Rejected returns',
    completedReturns: 'Completed returns',
    returnAnalysis: 'Return analysis',
    returnStatistics: 'Return statistics',
    returnsAmount: 'Returns amount',
    returnTime: 'Return time',
    searchReturns: 'Search returns...',
    selectOrderForReturn: 'Select an order to return products from',
    selectProductsToReturn: 'Select products to return',
    enterReturnNotes: 'Enter return notes...',
    confirmDeleteReturn: 'Are you sure you want to delete this return?',
    updateReturnInfo: 'Update return information',
    returnsGraph: 'Returns graph',
    noReturns: 'No returns',
    monthlyReturnsStatistics: 'Monthly returns statistics',
    returnsAnalysis: 'Returns analysis',
    chooseReturnReason: 'Choose return reason',
    confirmReturn: 'Confirm return',
    returnSuccess: 'Return completed successfully',
    returnProducts: 'Return products',
    chooseProductsToReturn: 'Choose products and quantities to return:',
    totalReturnValue: 'Total return value',
    updateReturnStatus: 'Update return status and notes',
    noBillsForReturn: 'No bills available for return',
    productsReturnedSuccessfully: 'Products returned successfully',
    returned: 'Returned',
    
    // Unknown Products
    unknownProductsDescription: 'Manage products not in the main catalog',
    noUnknownProducts: 'No unknown products found',
    convertToProduct: 'Convert to product',
    convertToProductDescription: 'Convert this unknown product to a regular product',
    enterSerialNumber: 'Enter serial number',
    enterPurchasePrice: 'Enter purchase price',
    enterTax: 'Enter tax',
    convert: 'Convert',
    view: 'View',
    remove: 'Remove',
    
    // Providers
    providerManagement: 'Provider Management',
    manageProviders: 'Manage providers',
    addProvider: 'Add provider',
    editProvider: 'Edit provider',
    deleteProvider: 'Delete provider',
    confirmDeleteProvider: 'Are you sure you want to delete this provider?',
    
    // Employees
    employeeManagement: 'Employee Management',
    manageEmployees: 'Manage employees',
    addEmployee: 'Add employee',
    editEmployee: 'Edit employee',
    deleteEmployee: 'Delete employee',
    confirmDeleteEmployee: 'Are you sure you want to delete this employee?',
    employeeName: 'Employee name',
    employeeRole: 'Employee role',
    employeePhone: 'Employee phone',
    employeeEmail: 'Employee email',
    employeeAddress: 'Employee address',
    employeeSalary: 'Employee salary',
    employeeHireDate: 'Employee hire date',
    employeeStatus: 'Employee status',
    activeEmployee: 'Active employee',
    inactiveEmployee: 'Inactive employee',
    role: 'Role',
    
    // Bills
    billManagement: 'Bill Management',
    manageBills: 'Manage bills',
    addBill: 'Add bill',
    editBill: 'Edit bill',
    deleteBill: 'Delete bill',
    confirmDeleteBill: 'Are you sure you want to delete this bill?',
    billTitle: 'Bill title',
    billAmount: 'Bill amount',
    dueDate: 'Due date',
    billStatus: 'Bill status',
    
    // Reports
    salesReport: 'Sales report',
    returnsReport: 'Returns report',
    profitReport: 'Profit report',
    inventoryReport: 'Inventory report',
    generateReport: 'Generate report',
    exportReport: 'Export report',
    
    // Settings
    account: 'Account',
    manageAccountInfo: 'Manage account information',
    fullName: 'Full name',
    phoneNumber: 'Phone number',
    storeName: 'Store name',
    language: 'Language',
    theme: 'Theme',
    notifications: 'Notifications',
    security: 'Security',
    dataManagement: 'Data management',
    storageStatus: 'Storage status',
    totalSize: 'Total size',
    clearAllData: 'Clear all data',
    confirmEraseAllData: 'Are you sure you want to erase all data? This action cannot be undone!',
    eraseAllData: 'Erase all data',
    
    // Time periods
    lastDay: 'Last day',
    last2Days: 'Last 2 days',
    last3Days: 'Last 3 days',
    lastWeek: 'Last week',
    lastMonth: 'Last month',
    last3Months: 'Last 3 months',
    last6Months: 'Last 6 months',
    customPeriod: 'Custom period',
    last7Days: 'Last 7 days',
    last30Days: 'Last 30 days',
    last90Days: 'Last 90 days',
    
    // Status values
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
    cancelled: 'Cancelled',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    refunded: 'Refunded',
    partiallyRefunded: 'Partially refunded',
    onHold: 'On hold',
    backOrdered: 'Back ordered',
    discontinued: 'Discontinued',
    preOrder: 'Pre order',
    draft: 'Draft',
    published: 'Published',
    archived: 'Archived',
    deleted: 'Deleted',
    suspended: 'Suspended',
    verified: 'Verified',
    unverified: 'Unverified',
    expired: 'Expired',
    renewed: 'Renewed',
    overdue: 'Overdue',
    paid: 'Paid',
    unpaid: 'Unpaid',
    partiallyPaid: 'Partially paid',
    
    // Additional
    sold: 'Sold',
    noSalesYet: 'No Sales Yet',
    startCreatingRequests: 'Start Creating Requests',
    useArrowKeys: 'Use Arrow Keys To Navigate',
    
    // Roles
    admin: 'Admin',
    
    // Invoice
    invoice: 'Invoice',
    totalAmount: 'Total Amount',
    
    // Cashier
    cashier: 'Cashier',
    cashierDashboard: 'Cashier Dashboard',
    unknownProduct: 'Unknown Product',
    addUnknownProduct: 'Add Unknown Product',
    enterPrice: 'Enter Price',
    
    // Messages
    orderCleared: 'Order Cleared Successfully',
    removedFromOrder: 'Removed From Order',
    
    // Dashboard items
    unknownRequests: 'Unknown Requests',
    
    // Tax
    tax: 'Tax',
    
    // Inventory
    inventory: 'Inventory',
    stock: 'Stock',
    outOfStock: 'Out of stock',
    inStock: 'In stock',
    lowStock: 'Low stock',
    
    // Sales
    sales: 'Sales',
    revenue: 'Revenue',
    cost: 'Cost',
    margin: 'Margin',
    
    // Customer
    customer: 'Customer',
    customers: 'Customers',
    
    // Payment
    payment: 'Payment',
    payments: 'Payments',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    card: 'Card',
    credit: 'Credit',
    
    // Time
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',
    
    // Charts
    chart: 'Chart',
    graph: 'Graph',
    statistics: 'Statistics',
    analytics: 'Analytics',
    
    // Actions
    print: 'Print',
    export: 'Export',
    import: 'Import',
    download: 'Download',
    upload: 'Upload',
    
    // Messages
    noData: 'No Data Available',
    warning: 'Warning',
    info: 'Information',
    
    // Validation
    required: 'This Field Is Required',
    invalid: 'Invalid Value',
    minLength: 'Minimum Length Is {min} Characters',
    maxLength: 'Maximum Length Is {max} Characters',
    minValue: 'Minimum Value Is {min}',
    maxValue: 'Maximum Value Is {max}',
    
    // Currency
    currency: 'Currency',
    amount: 'Amount',
    
    // Units
    pieces: 'Pieces',
    units: 'Units',
    kg: 'Kg',
    g: 'G',
    l: 'L',
    ml: 'Ml',
    
    // Status
    active: 'Active',
    inactive: 'Inactive',
    enabled: 'Enabled',
    disabled: 'Disabled',
    
    // User
    user: 'User',
    users: 'Users',
    username: 'Username',
    login: 'Login',
    logout: 'Logout',
    profile: 'Profile',
    
    // System
    system: 'System',
    configuration: 'Configuration',
    preferences: 'Preferences',
    backup: 'Backup',
    restore: 'Restore',
    maintenance: 'Maintenance',
    
    // Help
    help: 'Help',
    support: 'Support',
    documentation: 'Documentation',
    about: 'About',
    contact: 'Contact',
    
    // Other
    other: 'Other',
    miscellaneous: 'Miscellaneous',
    general: 'General',
    specific: 'Specific',
    custom: 'Custom',
    default: 'Default',
    automatic: 'Automatic',
    manual: 'Manual'
  }
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);