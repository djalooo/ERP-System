import React, { useState, useEffect } from 'react';
import { LanguageContext, translations, type Language, type LanguageContextType } from './language-context-definition';

const translationsData = {
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
    categories: 'Categories',
    addCategory: 'Add Category',
    manageCategories: 'Manage Categories',
    noCategories: 'No categories found',
    categoryName: 'Category Name',
    categoryNameRequired: 'Category name is required',

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
    view: 'View',
    more: 'More',

    // Welcome Screen
    appName: 'MPM',
    appSubtitle: 'Money Project Manager',
    welcomeMessage: 'Welcome!',
    startNow: 'Start Now',
    selectRole: 'Select Role',
    chooseYourRole: 'Choose your role to continue',

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
    productPartitioning: 'Product Partitioning',
    partitioningDesc: 'Organize your products into categories for better cashier experience.',
    uncategorizedProducts: 'Uncategorized Products',
    uncategorizedWarning: 'These products won\'t show correctly in cashier tabs.',
    fixNow: 'Fix Now',
    assignViaManagement: 'Assign via Management',
    assignDesc: 'Go to product management to edit categories individually.',
    createMissingCategories: 'Create Missing Categories',
    categoryDesc: 'Add new categories to better divide your inventory.',
    allCategorized: 'All products categorized!',
    allCategorizedDesc: 'Your inventory is well organized and ready for the cashier interface.',
    viewAllCategories: 'View All Categories',

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
    totalReturnsCount: 'Total returns',
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
    manageAccountSettings: 'Manage settings',
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
    manageSettingsDescription: 'Manage application settings and features.',
    featureManagement: 'Feature Management',
    enableTaxField: 'Enable Tax Field',
    clearDataByDate: 'Clear data by date',
    confirmClearByDate: 'Are you sure you want to delete all transactional data from {startDate} to {endDate}? This action cannot be undone.',
    dataClearedByDate: 'Data within the selected date range has been cleared.',
    contactTeam: 'Contact Team',

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

    // Status
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

    // Analytics
    sold: 'Sold',
    noSalesYet: 'No Sales Yet',
    startCreatingRequests: 'Start Creating Requests',
    useArrowKeys: 'Use Arrow Keys To Navigate',

    // Admin
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

    // Notifications
    orderCleared: 'Order Cleared Successfully',
    removedFromOrder: 'Removed From Order',

    // Storage
    unknownProductsSection: 'Unknown Products',
    unknownRequests: 'Unknown Requests',
    mostReturned: 'Top Returns',

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

    // Date/Time
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
    manual: 'Manual',

    // Cash Flow New Keys
    cashFlow: 'Cash Flow',
    manageBudgets: 'Manage budgets, and take control of your finances',
    capital: 'Capital',
    description: 'Description',
    filterByType: 'Filter by Type',
    allTypes: 'All Types',
    billType: 'Bill Type',
    details: 'Details'
  },
  ar: {
    // Navigation
    back: 'العودة',
    dashboard: 'لوحة التحكم',
    orders: 'الطلبات',
    products: 'المنتجات',
    providers: 'الموردين',
    employees: 'الموظفين',
    bills: 'التدفق النقدي', // Changed to Cash Flow as requested for sidebar
    returns: 'المرتجعات',
    reports: 'التقارير',
    settings: 'الإعدادات',
    unknownProducts: 'منتجات مجهولة',
    categories: 'الأصناف',
    addCategory: 'إضافة صنف',
    manageCategories: 'إدارة الأصناف',
    noCategories: 'لم يتم العثور على أصناف',
    categoryName: 'اسم الصنف',
    categoryNameRequired: 'اسم الصنف مطلوب',

    // Common
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    search: 'بحث',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'تم بنجاح',
    confirm: 'تأكيد',
    close: 'إغلاق',
    actions: 'الإجراءات',
    status: 'الحالة',
    date: 'التاريخ',
    time: 'الوقت',
    quantity: 'الكمية',
    price: 'السعر',
    total: 'الإجمالي',
    name: 'الاسم',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    address: 'العنوان',
    view: 'عرض',
    more: 'المزيد',

    // Welcome Screen
    appName: 'MPM',
    appSubtitle: 'مدير مشروع المال',
    welcomeMessage: 'مرحباً بك!',
    startNow: 'ابدأ الآن',
    selectRole: 'اختر الدور',
    chooseYourRole: 'اختر دورك للمتابعة',

    // Dashboard
    totalSales: 'إجمالي المبيعات',
    totalOrders: 'إجمالي الطلبات',
    totalProducts: 'إجمالي المنتجات',
    totalReturns: 'إجمالي المرتجعات',
    profits: 'الأرباح',
    topProducts: 'أفضل المنتجات',
    topReturns: 'أكثر المرتجعات',
    recentOrders: 'آخر الطلبات',
    bestSellingProducts: 'المنتجات الأكثر مبيعاً',
    topReturnedProducts: 'المنتجات الأكثر إرجاعاً',
    productPartitioning: 'تقسيم المنتجات',
    partitioningDesc: 'قم بتنظيم منتجاتك في أصناف لتجربة كاشير أفضل.',
    uncategorizedProducts: 'منتجات غير مصنفة',
    uncategorizedWarning: 'هذه المنتجات لن تظهر بشكل صحيح في تبويبات الكاشير.',
    fixNow: 'إصلاح الآن',
    assignViaManagement: 'التعيين عبر الإدارة',
    assignDesc: 'انتقل إلى إدارة المنتجات لتعديل الأصناف بشكل فردي.',
    createMissingCategories: 'إنشاء أصناف مفقودة',
    categoryDesc: 'أضف أصنافاً جديدة لتقسيم مخزونك بشكل أفضل.',
    allCategorized: 'جميع المنتجات مصنفة!',
    allCategorizedDesc: 'مخزونك منظم جيداً وجاهز لواجهة الكاشير.',
    viewAllCategories: 'عرض جميع الأصناف',

    // Orders
    orderHistory: 'سجل الطلبات',
    customerName: 'اسم العميل',
    orderNumber: 'رقم الطلب',
    orderStatus: 'حالة الطلب',
    orderDate: 'تاريخ الطلب',
    orderTotal: 'إجمالي الطلب',
    amountPaid: 'المبلغ المدفوع',
    remainingAmount: 'المبلغ المتبقي',
    completeOrder: 'إتمام الطلب',
    cancelOrder: 'إلغاء الطلب',
    newOrder: 'طلب جديد',
    noOrdersFound: 'لم يتم العثور على طلبات',

    // Products
    productName: 'اسم المنتج',
    serialNumber: 'الرقم التسلسلي',
    purchasePrice: 'سعر الشراء',
    salePrice: 'سعر البيع',
    productManagement: 'إدارة المنتجات',
    manageStoreProducts: 'إدارة منتجات المتجر',
    addProduct: 'إضافة منتج',
    editProduct: 'تعديل منتج',
    deleteProduct: 'حذف منتج',
    productSaveError: 'خطأ في حفظ المنتج',
    confirmDelete: 'هل أنت متأكد من حذف هذا العنصر؟',
    searchProducts: 'البحث عن منتجات...',
    enterProductName: 'أدخل اسم المنتج',
    enterPurchasePrice: 'أدخل سعر الشراء',
    enterSalePrice: 'أدخل سعر البيع',
    enterQuantity: 'أدخل الكمية',
    enterTaxPercentage: 'أدخل نسبة الضريبة',
    enterSerialNumber: 'أدخل الرقم التسلسلي',
    saving: 'جاري الحفظ...',
    saveProduct: 'حفظ المنتج',
    noCategory: 'بدون صنف',
    serialNumberAlreadyExists: 'الرقم التسلسلي مسجل مسبقاً',

    // Returns
    returnProduct: 'إرجاع منتج',
    returnManagement: 'إدارة المرتجعات',
    addReturn: 'إضافة مرتجع',
    editReturn: 'تعديل مرتجع',
    returnStatus: 'حالة المرتجع',
    returnReason: 'سبب المرتجع',
    returnNotes: 'ملاحظات المرتجع',
    returnAmount: 'مبلغ المرتجع',
    returnDetails: 'تفاصيل المرتجع',
    returnInformation: 'معلومات المرتجع',
    returnDate: 'تاريخ المرتجع',
    pendingReturns: 'مرتجعات معلقة',
    approvedReturns: 'مرتجعات مقبولة',
    rejectedReturns: 'مرتجعات مرفوضة',
    completedReturns: 'مرتجعات مكتملة',
    returnAnalysis: 'تحليل المرتجعات',
    returnStatistics: 'إحصائيات المرتجعات',
    totalReturnsCount: 'إجمالي المرتجعات',
    returnsAmount: 'مبلغ المرتجعات',
    returnTime: 'وقت المرتجع',
    searchReturns: 'البحث عن مرتجعات...',
    noReturns: 'لا توجد مرتجعات',
    returned: 'مرجع',
    selectOrderForReturn: 'اختر طلباً لإرجاع المنتجات منه',
    selectProductsToReturn: 'اختر المنتجات المراد إرجاعها',
    enterReturnNotes: 'أدخل ملاحظات حول الإرجاع...',
    confirmDeleteReturn: 'هل أنت متأكد من حذف هذا المرتجع؟',
    updateReturnInfo: 'تحديث معلومات المرتجع',
    returnsGraph: 'رسم بياني للمرتجعات',
    monthlyReturnsStatistics: 'إحصائيات المرتجعات الشهرية',
    returnsAnalysis: 'تحليل المرتجعات',
    chooseReturnReason: 'اختر سبب الإرجاع',
    confirmReturn: 'تأكيد الإرجاع',
    returnSuccess: 'تم إرجاع المنتجات بنجاح',
    returnProducts: 'إرجاع المنتجات',
    chooseProductsToReturn: 'اختر المنتجات والكميات للإرجاع:',
    totalReturnValue: 'إجمالي قيمة المرتجع',
    updateReturnStatus: 'تحديث حالة المرتجع والملاحظات',
    noBillsForReturn: 'لا توجد فواتير متاحة للإرجاع',
    productsReturnedSuccessfully: 'تم إرجاع المنتجات بنجاح',


    // Unknown Products
    unknownProductsDescription: 'إدارة المنتجات غير الموجودة في الكتالوج الرئيسي',
    noUnknownProducts: 'لم يتم العثور على منتجات مجهولة',
    convertToProduct: 'تحويل إلى منتج',
    convertToProductDescription: 'تحويل هذا المنتج المجهول إلى منتج دائم',
    remove: 'إزالة',
    enterTax: 'أدخل الضريبة',
    convert: 'تحويل',

    // Providers
    providerManagement: 'إدارة الموردين',
    manageProviders: 'إدارة الموردين',
    addProvider: 'إضافة مورد',
    editProvider: 'تعديل مورد',
    deleteProvider: 'حذف مورد',
    confirmDeleteProvider: 'هل أنت متأكد من حذف هذا المورد؟',

    // Employees
    employeeManagement: 'إدارة الموظفين',
    manageEmployees: 'إدارة الموظفين',
    addEmployee: 'إضافة موظف',
    editEmployee: 'تعديل موظف',
    deleteEmployee: 'حذف موظف',
    confirmDeleteEmployee: 'هل أنت متأكد من حذف هذا الموظف؟',
    employeeName: 'اسم الموظف',
    employeeRole: 'الدور الوظيفي',
    employeePhone: 'هاتف الموظف',
    employeeEmail: 'بريد الموظف',
    employeeAddress: 'عنوان الموظف',
    employeeSalary: 'راتب الموظف',
    employeeHireDate: 'تاريخ التعيين',
    employeeStatus: 'حالة الموظف',
    activeEmployee: 'نشط',
    inactiveEmployee: 'غير نشط',
    role: 'الدور',

    // Bills / Cash Flow
    billManagement: 'التدفق النقدي',
    manageBills: 'إدارة التدفق النقدي',
    addBill: 'إضافة',
    editBill: 'تعديل',
    deleteBill: 'حذف',
    confirmDeleteBill: 'هل أنت متأكد من حذف هذا السجل؟',
    billTitle: 'النوع',
    billAmount: 'القيمة',
    dueDate: 'تاريخ الاستحقاق',
    billStatus: 'الحالة',
    cashFlow: 'التدفق النقدي',
    manageBudgets: 'إدارة الميزانيات، والسيطرة على أموالك',
    capital: 'رأس المال',
    description: 'الوصف',
    filterByType: 'تصفية حسب النوع',
    allTypes: 'كل الأنواع',
    billType: 'نوع الفاتورة',
    details: 'التفاصيل',
    noBills: 'لا توجد سجلات',
    electricity: 'كهرباء',
    water: 'مياه',
    gas: 'غاز',
    rent: 'إيجار',
    goods: 'بضائع',
    fillAllFields: 'يرجى ملء جميع الحقول',
    selectBillType: 'اختر النوع',
    enterAmount: 'أدخل القيمة',
    selectStatus: 'اختر الحالة',
    enterDescription: 'أدخل الوصف',

    // Reports
    salesReport: 'تقرير المبيعات',
    returnsReport: 'تقرير المرتجعات',
    profitReport: 'تقرير الأرباح',
    inventoryReport: 'تقرير المخزون',
    generateReport: 'إنشاء تقرير',
    exportReport: 'تصدير تقرير',

    // Settings
    account: 'الحساب',
    manageAccountSettings: 'إدارة الإعدادات',
    fullName: 'الاسم الكامل',
    phoneNumber: 'رقم الهاتف',
    storeName: 'اسم المتجر',
    language: 'اللغة',
    theme: 'المظهر',
    notifications: 'التنبيهات',
    security: 'الأمان',
    dataManagement: 'إدارة البيانات',
    storageStatus: 'حالة التخزين',
    totalSize: 'الحجم الإجمالي',
    clearAllData: 'مسح جميع البيانات',
    confirmEraseAllData: 'هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء!',
    eraseAllData: 'مسح البيانات',
    manageSettingsDescription: 'إدارة إعدادات وميزات التطبيق.',
    featureManagement: 'إدارة الميزات',
    enableTaxField: 'تفعيل حقل الضريبة',
    clearDataByDate: 'مسح البيانات حسب التاريخ',
    confirmClearByDate: 'هل أنت متأكد من حذف السجلات من {startDate} إلى {endDate}؟',
    dataClearedByDate: 'تم مسح البيانات بنجاح.',
    contactTeam: 'تواصل مع الفريق',

    // Time periods
    lastDay: 'آخر يوم',
    last2Days: 'آخر يومين',
    last3Days: 'آخر 3 أيام',
    lastWeek: 'آخر أسبوع',
    lastMonth: 'آخر شهر',
    last3Months: 'آخر 3 أشهر',
    last6Months: 'آخر 6 أشهر',
    customPeriod: 'فترة مخصصة',
    last7Days: 'آخر 7 أيام',
    last30Days: 'آخر 30 يوم',
    last90Days: 'آخر 90 يوم',
    today: 'اليوم',
    yesterday: 'أمس',
    thisWeek: 'هذا الأسبوع',
    thisMonth: 'هذا الشهر',
    thisYear: 'هذه السنة',

    // Status
    pending: 'معلق',
    approved: 'مقبول',
    rejected: 'مرفوض',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    processing: 'قيد المعالجة',
    shipped: 'تم الشحن',
    delivered: 'تم التوصيل',
    refunded: 'مسترجع',
    partiallyRefunded: 'مسترجع جزئي',
    onHold: 'في الانتظار',
    backOrdered: 'طلب مؤجل',
    discontinued: 'توقف إنتاجه',
    preOrder: 'طلب مسبق',
    draft: 'مسودة',
    published: 'منشور',
    archived: 'مؤرشف',
    deleted: 'محذوف',
    suspended: 'موقف',
    verified: 'متحقق منه',
    unverified: 'غير متحقق',
    expired: 'منتهي الصلاحية',
    renewed: 'مجدد',
    overdue: 'متأخر',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    partiallyPaid: 'مدفوع جزئياً',

    // Analytics
    sold: 'تم البيع',
    noSalesYet: 'لا توجد مبيعات بعد',
    startCreatingRequests: 'ابدأ بإنشاء الطلبات',
    useArrowKeys: 'استخدم مفاتيح الأسهم للتنقل',

    // Admin
    admin: 'المسؤول',

    // Invoice
    invoice: 'فاتورة',
    totalAmount: 'المبلغ الإجمالي',

    // Cashier
    cashier: 'الكاشير',
    cashierDashboard: 'لوحة الكاشير',
    unknownProduct: 'منتج مجهول',
    addUnknownProduct: 'إضافة منتج مجهول',
    enterPrice: 'أدخل السعر',

    // Notifications
    orderCleared: 'تم مسح الطلب بنجاح',
    removedFromOrder: 'تمت الإزالة من الطلب',

    // Storage
    unknownProductsSection: 'قسم المنتجات المجهولة',
    unknownRequests: 'طلبات مجهولة',
    mostReturned: 'الأكثر إرجاعاً',

    // Tax
    tax: 'الضريبة',

    // Inventory
    inventory: 'المخزون',
    stock: 'المخزون',
    outOfStock: 'نفذ من المخزون',
    inStock: 'متوفر',
    lowStock: 'مخزون منخفض',

    // Sales
    sales: 'المبيعات',
    revenue: 'الإيرادات',
    cost: 'التكلفة',
    margin: 'الهامش',

    // Customer
    customer: 'العميل',
    customers: 'العملاء',

    // Payment
    payment: 'الدفع',
    payments: 'المدفوعات',
    paymentMethod: 'طريقة الدفع',
    cash: 'نقدي',
    card: 'بطاقة',
    credit: 'آجل',

    // Date/Time

    // Charts
    chart: 'مخطط',
    graph: 'رسم بياني',
    statistics: 'إحصائيات',
    analytics: 'تحليلات',

    // Actions
    print: 'طباعة',
    export: 'تصدير',
    import: 'استيراد',
    download: 'تنزيل',
    upload: 'رفع',

    // Messages
    noData: 'لا توجد بيانات',
    warning: 'تحذير',
    info: 'معلومات',

    // Validation
    required: 'هذا الحقل مطلوب',
    invalid: 'قيمة غير صالحة',
    minLength: 'الحد الأدنى للطول هو {min} أحرف',
    maxLength: 'الحد الأقصى للطول هو {max} أحرف',
    minValue: 'الحد الأدنى للقيمة هو {min}',
    maxValue: 'الحد الأقصى للقيمة هو {max}',

    // Currency
    currency: 'العملة',
    amount: 'المبلغ',

    // Units
    pieces: 'قطع',
    units: 'وحدات',
    kg: 'كجم',
    g: 'جم',
    l: 'لتر',
    ml: 'مل',

    // User
    user: 'مستخدم',
    users: 'مستخدمين',
    username: 'اسم المستخدم',
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    profile: 'الملف الشخصي',

    // System
    system: 'النظام',
    configuration: 'تكوين',
    preferences: 'تفضيلات',
    backup: 'نسخ احتياطي',
    restore: 'استعادة',
    maintenance: 'صيانة',

    // Help
    help: 'مساعدة',
    support: 'دعم',
    documentation: 'توثيق',
    about: 'حول',
    contact: 'اتصال',

    // Other
    other: 'أخرى',
    miscellaneous: 'متنوع',
    general: 'عام',
    specific: 'محدد',
    custom: 'مخصص',
    default: 'افتراضي',
    automatic: 'تلقائي',
    manual: 'يدوي',
  },
  fr: {
    // Navigation
    back: 'Retour',
    dashboard: 'Tableau de bord',
    orders: 'Commandes',
    products: 'Produits',
    providers: 'Fournisseurs',
    employees: 'Employés',
    bills: 'Flux de trésorerie', // Changed to Cash Flow for sidebar
    returns: 'Retours',
    reports: 'Rapports',
    settings: 'Paramètres',
    unknownProducts: 'Produits inconnus',
    categories: 'Catégories',
    addCategory: 'Ajouter une catégorie',
    manageCategories: 'Gérer les catégories',
    noCategories: 'Aucune catégorie trouvée',
    categoryName: 'Nom de la catégorie',
    categoryNameRequired: 'Le nom de la catégorie est requis',

    // Common
    add: 'Ajouter',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    search: 'Rechercher',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    confirm: 'Confirmer',
    close: 'Fermer',
    actions: 'Actions',
    status: 'Statut',
    date: 'Date',
    time: 'Heure',
    quantity: 'Quantité',
    price: 'Prix',
    total: 'Total',
    name: 'Nom',
    phone: 'Téléphone',
    email: 'E-mail',
    address: 'Adresse',
    view: 'Voir',
    more: 'Plus',

    // Welcome Screen
    appName: 'MPM',
    appSubtitle: 'Gestionnaire de Projet Financier',
    welcomeMessage: 'Bienvenue !',
    startNow: 'Démarrer maintenant',
    selectRole: 'Sélectionner un rôle',
    chooseYourRole: 'Choisissez votre rôle pour continuer',

    // Dashboard
    totalSales: 'Ventes totales',
    totalOrders: 'Commandes totales',
    totalProducts: 'Produits totaux',
    totalReturns: 'Retours totaux',
    profits: 'Bénéfices',
    topProducts: 'Meilleurs produits',
    topReturns: 'Meilleurs retours',
    recentOrders: 'Commandes récentes',
    bestSellingProducts: 'Produits les plus vendus',
    topReturnedProducts: 'Produits les plus retournés',
    productPartitioning: 'Partitionnement des produits',
    partitioningDesc: 'Organisez vos produits en catégories pour une meilleure expérience de caisse.',
    uncategorizedProducts: 'Produits non catégorisés',
    uncategorizedWarning: 'Ces produits ne s\'afficheront pas correctement dans les onglets de la caisse.',
    fixNow: 'Corriger maintenant',
    assignViaManagement: 'Assigner via la gestion',
    assignDesc: 'Allez dans la gestion des produits pour modifier les catégories individuellement.',
    createMissingCategories: 'Créer les catégories manquantes',
    categoryDesc: 'Ajoutez de nouvelles catégories pour mieux diviser votre inventaire.',
    allCategorized: 'Tous les produits sont catégorisés !',
    allCategorizedDesc: 'Votre inventaire est bien organisé et prêt pour l\'interface de caisse.',
    viewAllCategories: 'Voir toutes les catégories',

    // Orders
    orderHistory: 'Historique des commandes',
    customerName: 'Nom du client',
    orderNumber: 'Numéro de commande',
    orderStatus: 'Statut de la commande',
    orderDate: 'Date de la commande',
    orderTotal: 'Total de la commande',
    amountPaid: 'Montant payé',
    remainingAmount: 'Montant restant',
    completeOrder: 'Terminer la commande',
    cancelOrder: 'Annuler la commande',
    newOrder: 'Nouvelle commande',
    noOrdersFound: 'Aucune commande trouvée',

    // Products
    productName: 'Nom du produit',
    serialNumber: 'Numéro de série',
    purchasePrice: 'Prix d\'achat',
    salePrice: 'Prix de vente',
    productManagement: 'Gestion des produits',
    manageStoreProducts: 'Gérer les produits du magasin',
    addProduct: 'Ajouter un produit',
    editProduct: 'Modifier un produit',
    deleteProduct: 'Supprimer un produit',
    productSaveError: 'Erreur lors de l\'enregistrement du produit',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
    searchProducts: 'Rechercher des produits...',
    enterProductName: 'Entrer le nom du produit',
    enterPurchasePrice: 'Entrer le prix d\'achat',
    enterSalePrice: 'Entrer le prix de vente',
    enterQuantity: 'Entrer la quantité',
    enterTaxPercentage: 'Entrer le pourcentage de taxe',
    enterSerialNumber: 'Entrer le numéro de série',
    saving: 'Enregistrement...',
    saveProduct: 'Enregistrer le produit',
    noCategory: 'Aucune catégorie',
    serialNumberAlreadyExists: 'Le numéro de série existe déjà',

    // Returns
    returnProduct: 'Retourner un produit',
    returnManagement: 'Gestion des retours',
    addReturn: 'Ajouter un retour',
    editReturn: 'Modifier un retour',
    returnStatus: 'Statut du retour',
    returnReason: 'Raison du retour',
    returnNotes: 'Notes du retour',
    returnAmount: 'Montant du retour',
    returnDetails: 'Détails du retour',
    returnInformation: 'Information du retour',
    returnDate: 'Date du retour',
    pendingReturns: 'Retours en attente',
    approvedReturns: 'Retours approuvés',
    rejectedReturns: 'Retours rejetés',
    completedReturns: 'Retours terminés',
    returnAnalysis: 'Analyse des retours',
    returnStatistics: 'Statistiques des retours',
    totalReturnsCount: 'Total des retours',
    returnsAmount: 'Montant des retours',
    returnTime: 'Heure du retour',
    searchReturns: 'Rechercher des retours...',
    noReturns: 'Aucun retour',
    returned: 'Retourné',
    selectOrderForReturn: 'Sélectionner une commande pour retourner des produits',
    selectProductsToReturn: 'Sélectionner les produits à retourner',
    enterReturnNotes: 'Entrer les notes de retour...',
    confirmDeleteReturn: 'Êtes-vous sûr de vouloir supprimer ce retour ?',
    updateReturnInfo: 'Mettre à jour les informations de retour',
    returnsGraph: 'Graphique des retours',
    monthlyReturnsStatistics: 'Statistiques mensuelles des retours',
    returnsAnalysis: 'Analyse des retours',
    chooseReturnReason: 'Choisir la raison du retour',
    confirmReturn: 'Confirmer le retour',
    returnSuccess: 'Retour effectué avec succès',
    returnProducts: 'Retourner les produits',
    chooseProductsToReturn: 'Choisissez les produits et quantités à retourner :',
    totalReturnValue: 'Valeur totale du retour',
    updateReturnStatus: 'Mettre à jour le statut et les notes',
    noBillsForReturn: 'Aucune facture disponible pour le retour',
    productsReturnedSuccessfully: 'Produits retournés avec succès',

    // Unknown Products
    unknownProductsDescription: 'Gérer les produits absents du catalogue principal',
    noUnknownProducts: 'Aucun produit inconnu trouvé',
    convertToProduct: 'Convertir en produit',
    convertToProductDescription: 'Convertir ce produit inconnu en produit régulier',
    remove: 'Supprimer',
    enterTax: 'Entrer la taxe',
    convert: 'Convertir',

    // Providers
    providerManagement: 'Gestion des fournisseurs',
    manageProviders: 'Gérer les fournisseurs',
    addProvider: 'Ajouter un fournisseur',
    editProvider: 'Modifier un fournisseur',
    deleteProvider: 'Supprimer un fournisseur',
    confirmDeleteProvider: 'Êtes-vous sûr de vouloir supprimer ce fournisseur ?',

    // Employees
    employeeManagement: 'Gestion des employés',
    manageEmployees: 'Gérer les employés',
    addEmployee: 'Ajouter un employé',
    editEmployee: 'Modifier un employé',
    deleteEmployee: 'Supprimer un employé',
    confirmDeleteEmployee: 'Êtes-vous sûr de vouloir supprimer cet employé ?',
    employeeName: 'Nom de l\'employé',
    employeeRole: 'Rôle de l\'employé',
    employeePhone: 'Téléphone de l\'employé',
    employeeEmail: 'E-mail de l\'employé',
    employeeAddress: 'Adresse de l\'employé',
    employeeSalary: 'Salaire de l\'employé',
    employeeHireDate: 'Date d\'embauche',
    employeeStatus: 'Statut de l\'employé',
    activeEmployee: 'Actif',
    inactiveEmployee: 'Inactif',
    role: 'Rôle',

    // Bills / Cash Flow
    billManagement: 'Flux de trésorerie',
    manageBills: 'Gérer le flux de trésorerie',
    addBill: 'Ajouter',
    editBill: 'Modifier',
    deleteBill: 'Supprimer',
    confirmDeleteBill: 'Êtes-vous sûr de vouloir supprimer cet enregistrement ?',
    billTitle: 'Type',
    billAmount: 'Montant',
    dueDate: 'Date d\'échéance',
    billStatus: 'Statut',
    cashFlow: 'Flux de trésorerie',
    manageBudgets: 'Gérez vos budgets et prenez le contrôle de vos finances',
    capital: 'Capital',
    description: 'Description',
    filterByType: 'Filtrer par type',
    allTypes: 'Tous les types',
    billType: 'Type de facture',
    details: 'Détails',
    noBills: 'Aucun enregistrement',
    electricity: 'Électricité',
    water: 'Eau',
    gas: 'Gaz',
    rent: 'Loyer',
    goods: 'Marchandises',
    fillAllFields: 'Veuillez remplir tous les champs',
    selectBillType: 'Sélectionner le type',
    enterAmount: 'Entrer le montant',
    selectStatus: 'Sélectionner le statut',
    enterDescription: 'Entrer la description',

    // Reports
    salesReport: 'Rapport des ventes',
    returnsReport: 'Rapport des retours',
    profitReport: 'Rapport des bénéfices',
    inventoryReport: 'Rapport d\'inventaire',
    generateReport: 'Générer le rapport',
    exportReport: 'Exporter le rapport',

    // Settings
    account: 'Compte',
    manageAccountSettings: 'Gérer les paramètres',
    fullName: 'Nom complet',
    phoneNumber: 'Numéro de téléphone',
    storeName: 'Nom du magasin',
    language: 'Langue',
    theme: 'Thème',
    notifications: 'Notifications',
    security: 'Sécurité',
    dataManagement: 'Gestion des données',
    storageStatus: 'État du stockage',
    totalSize: 'Taille totale',
    clearAllData: 'Effacer toutes les données',
    confirmEraseAllData: 'Êtes-vous sûr de vouloir effacer toutes les données ? Cette action est irréversible !',
    eraseAllData: 'Effacer les données',
    manageSettingsDescription: 'Gérer les paramètres et fonctionnalités de l\'application.',
    featureManagement: 'Gestion des fonctionnalités',
    enableTaxField: 'Activer le champ taxe',
    clearDataByDate: 'Effacer les données par date',
    confirmClearByDate: 'Êtes-vous sûr de vouloir supprimer les enregistrements du {startDate} au {endDate} ?',
    dataClearedByDate: 'Les données ont été effacées avec succès.',
    contactTeam: 'Contacter l\'équipe',

    // Time periods
    lastDay: 'Dernier jour',
    last2Days: '2 derniers jours',
    last3Days: '3 derniers jours',
    lastWeek: 'Dernière semaine',
    lastMonth: 'Dernier mois',
    last3Months: '3 derniers mois',
    last6Months: '6 derniers mois',
    customPeriod: 'Période personnalisée',
    last7Days: '7 derniers jours',
    last30Days: '30 derniers jours',
    last90Days: '90 derniers jours',
    today: 'Aujourd\'hui',
    yesterday: 'Hier',
    thisWeek: 'Cette semaine',
    thisMonth: 'Ce mois',
    thisYear: 'Cette année',

    // Status
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    completed: 'Terminé',
    cancelled: 'Annulé',
    processing: 'En cours',
    shipped: 'Expédié',
    delivered: 'Livré',
    refunded: 'Remboursé',
    partiallyRefunded: 'Partiellement remboursé',
    onHold: 'En attente',
    backOrdered: 'Commande différée',
    discontinued: 'Abandonné',
    preOrder: 'Précommande',
    draft: 'Brouillon',
    published: 'Publié',
    archived: 'Archivé',
    deleted: 'Supprimé',
    suspended: 'Suspendu',
    verified: 'Vérifié',
    unverified: 'Non vérifié',
    expired: 'Expiré',
    renewed: 'Renouvelé',
    overdue: 'En retard',
    paid: 'Payé',
    unpaid: 'Impayé',
    partiallyPaid: 'Partiellement payé',

    // Analytics
    sold: 'Vendu',
    noSalesYet: 'Aucune vente pour le moment',
    startCreatingRequests: 'Commencez à créer des commandes',
    useArrowKeys: 'Utilisez les touches fléchées pour naviguer',

    // Admin
    admin: 'Admin',

    // Invoice
    invoice: 'Facture',
    totalAmount: 'Montant total',

    // Cashier
    cashier: 'Caisse',
    cashierDashboard: 'Tableau de bord caisse',
    unknownProduct: 'Produit inconnu',
    addUnknownProduct: 'Ajouter un produit inconnu',
    enterPrice: 'Entrer le prix',

    // Notifications
    orderCleared: 'Commande effacée avec succès',
    removedFromOrder: 'Retiré de la commande',

    // Storage
    unknownProductsSection: 'Section produits inconnus',
    unknownRequests: 'Demandes inconnues',
    mostReturned: 'Plus retournés',

    // Tax
    tax: 'Taxe',

    // Inventory
    inventory: 'Inventaire',
    stock: 'Stock',
    outOfStock: 'Rupture de stock',
    inStock: 'En stock',
    lowStock: 'Stock faible',

    // Sales
    sales: 'Ventes',
    revenue: 'Revenu',
    cost: 'Coût',
    margin: 'Marge',

    // Customer
    customer: 'Client',
    customers: 'Clients',

    // Payment
    payment: 'Paiement',
    payments: 'Paiements',
    paymentMethod: 'Mode de paiement',
    cash: 'Espèces',
    card: 'Carte',
    credit: 'Crédit',

    // Charts
    chart: 'Graphique',
    graph: 'Graphe',
    statistics: 'Statistiques',
    analytics: 'Analytique',

    // Actions
    print: 'Imprimer',
    export: 'Exporter',
    import: 'Importer',
    download: 'Télécharger',
    upload: 'Téléverser',

    // Messages
    noData: 'Aucune donnée disponible',
    warning: 'Attention',
    info: 'Information',

    // Validation
    required: 'Ce champ est requis',
    invalid: 'Valeur invalide',
    minLength: 'La longueur minimale est de {min} caractères',
    maxLength: 'La longueur maximale est de {max} caractères',
    minValue: 'La valeur minimale est {min}',
    maxValue: 'La valeur maximale est {max}',

    // Currency
    currency: 'Devise',
    amount: 'Montant',

    // Units
    pieces: 'Pièces',
    units: 'Unités',
    kg: 'Kg',
    g: 'G',
    l: 'L',
    ml: 'Ml',

    // User
    user: 'Utilisateur',
    users: 'Utilisateurs',
    username: 'Nom d\'utilisateur',
    login: 'Connexion',
    logout: 'Déconnexion',
    profile: 'Profil',

    // System
    system: 'Système',
    configuration: 'Configuration',
    preferences: 'Préférences',
    backup: 'Sauvegarde',
    restore: 'Restauration',
    maintenance: 'Maintenance',

    // Help
    help: 'Aide',
    support: 'Support',
    documentation: 'Documentation',
    about: 'À propos',
    contact: 'Contact',

    // Other
    other: 'Autre',
    miscellaneous: 'Divers',
    general: 'Général',
    specific: 'Spécifique',
    custom: 'Personnalisé',
    default: 'Défaut',
    automatic: 'Automatique',
    manual: 'Manuel',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('mpm_language') as Language;
    if (savedLanguage && translationsData[savedLanguage]) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('mpm_language', lang);
  };

  const t = (key: string): string => {
    return translationsData[language]?.[key] || translationsData['en']?.[key] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      <div dir="ltr">
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

// Re-export useLanguage hook
export { useLanguage } from '../hooks/use-language';
