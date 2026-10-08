import { RawExtractedFmb, RawExtractedItem } from '../models/fmb-models';

/**
 * Generates baseline unchanged ERP objects so large form navigation,
 * filtering, and "Only changes" vs "Show unchanged" work realistically.
 */
function buildStandardUnchangedObjects(): RawExtractedItem[] {
  const items: RawExtractedItem[] = [
    // Windows
    {
      type: 'WINDOW',
      name: 'W_MAIN',
      parentPath: [],
      rawAttributes: {
        Title: 'Customer Master Maintenance',
        Width: 1024,
        Height: 768,
        WindowStyle: 'Document',
        Modal: false,
        MinimizeAllowed: true,
        MaximizeAllowed: true,
      },
    },
    {
      type: 'WINDOW',
      name: 'W_AUDIT_MODAL',
      parentPath: [],
      rawAttributes: {
        Title: 'Compliance Audit History',
        Width: 640,
        Height: 420,
        WindowStyle: 'Dialog',
        Modal: true,
        MinimizeAllowed: false,
        MaximizeAllowed: false,
      },
    },
    // Canvases
    {
      type: 'CANVAS',
      name: 'CV_CUSTOMER_MAIN',
      parentPath: [],
      rawAttributes: {
        CanvasType: 'Content',
        WindowName: 'W_MAIN',
        Width: 1024,
        Height: 720,
        ViewportWidth: 1024,
        ViewportHeight: 720,
      },
    },
    {
      type: 'CANVAS',
      name: 'CV_TAB_DETAILS',
      parentPath: [],
      rawAttributes: {
        CanvasType: 'Tab',
        WindowName: 'W_MAIN',
        Width: 980,
        Height: 460,
      },
    },
    // Blocks
    {
      type: 'BLOCK',
      name: 'CONTROL',
      parentPath: [],
      rawAttributes: {
        DatabaseDataBlock: false,
        SingleRecord: true,
        QueryAllowed: false,
        InsertAllowed: false,
        UpdateAllowed: false,
      },
    },
    {
      type: 'BLOCK',
      name: 'ORDERS_SUMMARY',
      parentPath: [],
      rawAttributes: {
        DatabaseDataBlock: true,
        QueryDataSourceName: 'AR_CUSTOMER_ORDERS_V',
        RecordsDisplayed: 10,
        QueryAllowed: true,
        InsertAllowed: false,
        UpdateAllowed: false,
        OrderByClause: 'ORDER_DATE DESC',
      },
    },
    // LOVs
    {
      type: 'LOV',
      name: 'LOV_PAYMENT_TERMS',
      parentPath: [],
      rawAttributes: {
        Title: 'Select Payment Terms',
        RecordGroupName: 'RG_PAYMENT_TERMS',
        Width: 420,
        Height: 300,
        AutoRefresh: true,
      },
    },
    {
      type: 'LOV',
      name: 'LOV_SALES_REP',
      parentPath: [],
      rawAttributes: {
        Title: 'Select Account Representative',
        RecordGroupName: 'RG_SALES_REP',
        Width: 450,
        Height: 320,
        AutoRefresh: false,
      },
    },
    // Record Groups
    {
      type: 'RECORD_GROUP',
      name: 'RG_PAYMENT_TERMS',
      parentPath: [],
      rawAttributes: {
        RecordGroupType: 'Query',
        RecordGroupFetchSize: 50,
      },
      sourceType: 'SQL',
      sourceCode: `SELECT term_id, term_code, description, net_days
  FROM ar_payment_terms
 WHERE enabled_flag = 'Y'
 ORDER BY net_days ASC`,
    },
    {
      type: 'RECORD_GROUP',
      name: 'RG_SALES_REP',
      parentPath: [],
      rawAttributes: {
        RecordGroupType: 'Query',
        RecordGroupFetchSize: 100,
      },
      sourceType: 'SQL',
      sourceCode: `SELECT salesrep_id, full_name, territory_code
  FROM jtf_rs_salesreps_v
 WHERE status = 'A'
 ORDER BY full_name`,
    },
  ];

  // Add standard unchanged items to reach a realistic module object count
  const standardCustomerFields = [
    ['CUSTOMER_ID', 'Number', 90, 'Customer ID', true],
    ['ACCOUNT_NUMBER', 'Char', 120, 'Account #', true],
    ['STATUS_CODE', 'Char', 70, 'Status', true],
    ['CREATED_BY', 'Char', 100, 'Created By', false],
    ['CREATION_DATE', 'Date', 110, 'Created On', false],
    ['LAST_UPDATED_BY', 'Char', 100, 'Updated By', false],
    ['LAST_UPDATE_DATE', 'Date', 110, 'Updated On', false],
    ['CURRENCY_CODE', 'Char', 65, 'Currency', true],
    ['PAYMENT_TERM_ID', 'Number', 110, 'Payment Terms', true],
    ['SALESREP_ID', 'Number', 130, 'Sales Rep', false],
    ['SIC_CODE', 'Char', 85, 'SIC Code', false],
    ['DUNS_NUMBER', 'Char', 105, 'DUNS Number', false],
    ['FREIGHT_TERMS', 'Char', 115, 'Freight Terms', false],
    ['FOB_POINT', 'Char', 95, 'FOB Point', false],
    ['WAREHOUSE_ID', 'Number', 90, 'Default Warehouse', false],
    ['PRICE_LIST_ID', 'Number', 125, 'Price List', true],
  ] as const;

  for (const [fieldName, dataType, width, prompt, required] of standardCustomerFields) {
    items.push({
      type: 'ITEM',
      name: fieldName,
      parentPath: ['CUSTOMER'],
      rawAttributes: {
        ItemType: 'Text Item',
        DataType: dataType,
        Width: width,
        Height: 22,
        Prompt: prompt,
        Required: required,
        CanvasName: 'CV_CUSTOMER_MAIN',
        DatabaseItem: true,
        QueryAllowed: true,
        UpdateAllowed: fieldName !== 'CUSTOMER_ID',
      },
    });
  }

  const orderFields = [
    ['ORDER_ID', 'Number', 85, 'Order ID'],
    ['ORDER_NUMBER', 'Char', 110, 'Order Number'],
    ['ORDER_DATE', 'Date', 100, 'Order Date'],
    ['ORDER_STATUS', 'Char', 90, 'Status'],
    ['ORDER_TOTAL', 'Number', 115, 'Total Amount'],
    ['INVOICE_STATUS', 'Char', 100, 'Invoiced'],
  ] as const;

  for (const [fieldName, dataType, width, prompt] of orderFields) {
    items.push({
      type: 'ITEM',
      name: fieldName,
      parentPath: ['ORDERS_SUMMARY'],
      rawAttributes: {
        ItemType: 'Text Item',
        DataType: dataType,
        Width: width,
        Height: 20,
        Prompt: prompt,
        Required: false,
        CanvasName: 'CV_TAB_DETAILS',
        DatabaseItem: true,
        QueryAllowed: true,
        UpdateAllowed: false,
      },
    });
  }

  return items;
}

export function getCustomerV1Fixture(customFileName = 'customer_v1.fmb', customSize = 2516582): RawExtractedFmb {
  const baseItems = buildStandardUnchangedObjects();

  const v1SpecificItems: RawExtractedItem[] = [
    {
      type: 'BLOCK',
      name: 'CUSTOMER',
      parentPath: [],
      rawAttributes: {
        DatabaseDataBlock: true,
        QueryDataSourceName: 'AR_CUSTOMERS',
        RecordsDisplayed: 1,
        QueryAllowed: true,
        InsertAllowed: true,
        UpdateAllowed: true,
        DeleteAllowed: true,
        LockingMode: 'Automatic',
      },
    },
    {
      type: 'ITEM',
      name: 'CUSTOMER_NAME',
      parentPath: ['CUSTOMER'],
      rawAttributes: {
        ItemType: 'Text Item',
        DataType: 'Char',
        MaximumLength: 80,
        Prompt: 'Name',
        Width: 150,
        Height: 22,
        Required: true,
        CanvasName: 'CV_CUSTOMER_MAIN',
        DatabaseItem: true,
      },
    },
    {
      type: 'ITEM',
      name: 'NAME',
      parentPath: ['CUSTOMER'],
      rawAttributes: {
        ItemType: 'Text Item',
        DataType: 'Char',
        MaximumLength: 60,
        Prompt: 'Short Name',
        Width: 150,
        Height: 22,
        Required: true,
        CanvasName: 'CV_CUSTOMER_MAIN',
        DatabaseItem: true,
      },
    },
    {
      type: 'ITEM',
      name: 'OLD_CODE',
      parentPath: ['CUSTOMER'],
      rawAttributes: {
        ItemType: 'Text Item',
        DataType: 'Char',
        MaximumLength: 15,
        Prompt: 'Legacy Code',
        Width: 80,
        Height: 22,
        Required: false,
        CanvasName: 'CV_CUSTOMER_MAIN',
        DatabaseItem: true,
      },
    },
    {
      type: 'ITEM',
      name: 'CREDIT_LIMIT',
      parentPath: ['CUSTOMER'],
      rawAttributes: {
        ItemType: 'Text Item',
        DataType: 'Number',
        MaximumLength: 12,
        Prompt: 'Credit Limit',
        Width: 95,
        Height: 22,
        Required: false,
        FormatMask: '999,990.00',
        CanvasName: 'CV_CUSTOMER_MAIN',
        DatabaseItem: true,
      },
    },
    {
      type: 'ITEM',
      name: 'TAX_REFERENCE',
      parentPath: ['CUSTOMER'],
      rawAttributes: {
        ItemType: 'Text Item',
        DataType: 'Char',
        MaximumLength: 25,
        Prompt: 'Tax ID',
        Width: 120,
        Height: 22,
        ValidateFromList: false,
        LovName: '',
        CanvasName: 'CV_CUSTOMER_MAIN',
        DatabaseItem: true,
      },
    },
    {
      type: 'ITEM',
      name: 'LEGACY_FAX_NO',
      parentPath: ['CUSTOMER'],
      rawAttributes: {
        ItemType: 'Text Item',
        DataType: 'Char',
        MaximumLength: 20,
        Prompt: 'Fax Number',
        Width: 110,
        Height: 22,
        Required: false,
        CanvasName: 'CV_CUSTOMER_MAIN',
        DatabaseItem: true,
      },
    },
    // Triggers
    {
      type: 'TRIGGER',
      name: 'WHEN-BUTTON-PRESSED',
      parentPath: ['CUSTOMER'],
      rawAttributes: {
        ExecutionHierarchy: 'Override',
        FireInEnterQueryMode: false,
      },
      sourceType: 'PLSQL',
      sourceCode: `BEGIN
  validate_customer;
  COMMIT_FORM;
END;`,
    },
    {
      type: 'TRIGGER',
      name: 'WHEN-VALIDATE-ITEM',
      parentPath: ['CUSTOMER', 'CUSTOMER_NAME'],
      rawAttributes: {
        ExecutionHierarchy: 'Before',
        FireInEnterQueryMode: false,
      },
      sourceType: 'PLSQL',
      sourceCode: `BEGIN
  IF :CUSTOMER.CUSTOMER_NAME IS NULL THEN
    MESSAGE('Customer name is required.');
    RAISE FORM_TRIGGER_FAILURE;
  END IF;
  :CUSTOMER.CUSTOMER_NAME := RTRIM(:CUSTOMER.CUSTOMER_NAME);
END;`,
    },
    {
      type: 'TRIGGER',
      name: 'PRE-INSERT',
      parentPath: ['CUSTOMER'],
      rawAttributes: {
        ExecutionHierarchy: 'Before',
        FireInEnterQueryMode: false,
      },
      sourceType: 'PLSQL',
      sourceCode: `BEGIN
  SELECT ar_customers_s.NEXTVAL
    INTO :CUSTOMER.CUSTOMER_ID
    FROM dual;
  :CUSTOMER.CREATION_DATE := SYSDATE;
END;`,
    },
    {
      type: 'TRIGGER',
      name: 'ON-DELETE',
      parentPath: ['CUSTOMER'],
      rawAttributes: {
        ExecutionHierarchy: 'Override',
        FireInEnterQueryMode: false,
      },
      sourceType: 'PLSQL',
      sourceCode: `BEGIN
  DELETE FROM ar_customers
   WHERE customer_id = :CUSTOMER.CUSTOMER_ID;
END;`,
    },
    // Program Units
    {
      type: 'PROGRAM_UNIT',
      name: 'VALIDATE_CUSTOMER',
      parentPath: [],
      rawAttributes: {
        ProgramUnitType: 'Procedure',
      },
      sourceType: 'PLSQL',
      sourceCode: `PROCEDURE validate_customer IS
BEGIN
  IF :CUSTOMER.CUSTOMER_NAME IS NULL THEN
    RAISE FORM_TRIGGER_FAILURE;
  END IF;

  IF NVL(:CUSTOMER.CREDIT_LIMIT, 0) < 0 THEN
    MESSAGE('Credit limit cannot be negative.');
    RAISE FORM_TRIGGER_FAILURE;
  END IF;
END validate_customer;`,
    },
    {
      type: 'PROGRAM_UNIT',
      name: 'SYNC_LEGACY_CODE',
      parentPath: [],
      rawAttributes: {
        ProgramUnitType: 'Procedure',
      },
      sourceType: 'PLSQL',
      sourceCode: `PROCEDURE sync_legacy_code IS
BEGIN
  IF :CUSTOMER.OLD_CODE IS NOT NULL THEN
    ar_legacy_bridge_pkg.sync_code(:CUSTOMER.CUSTOMER_ID, :CUSTOMER.OLD_CODE);
  END IF;
END sync_legacy_code;`,
    },
  ];

  return {
    fileName: customFileName,
    fileSize: customSize,
    moduleName: 'CUSTOMER_FORM',
    formsVersion: '12.2.1.4.0',
    extractionMethod: 'frmf2xml',
    formAttributes: {
      Title: 'Customer Master Form',
      ConsoleWindow: 'W_MAIN',
      FirstNavigationBlockName: 'CUSTOMER',
      ValidationUnit: 'Item',
      InteractionMode: 'Blocking',
    },
    items: [...v1SpecificItems, ...baseItems],
  };
}

export function getCustomerV2Fixture(customFileName = 'customer_v2.fmb', customSize = 2726297): RawExtractedFmb {
  const baseItems = buildStandardUnchangedObjects();

  const v2SpecificItems: RawExtractedItem[] = [
    {
      type: 'BLOCK',
      name: 'CUSTOMER',
      parentPath: [],
      rawAttributes: {
        DatabaseDataBlock: true,
        QueryDataSourceName: 'AR_CUSTOMERS',
        RecordsDisplayed: 1,
        QueryAllowed: true,
        InsertAllowed: true,
        UpdateAllowed: true,
        DeleteAllowed: false,
        LockingMode: 'Automatic',
      },
    },
    {
      type: 'BLOCK',
      name: 'ADDRESS',
      parentPath: [],
      rawAttributes: {
        DatabaseDataBlock: true,
        QueryDataSourceName: 'AR_CUSTOMER_ADDRESSES',
        RecordsDisplayed: 4,
        QueryAllowed: true,
        InsertAllowed: true,
        UpdateAllowed: true,
        DeleteAllowed: false,
      },
    },
    {
      type: 'ITEM',
      name: 'CUSTOMER_NAME',
      parentPath: ['CUSTOMER'],
      rawAttributes: {
        ItemType: 'Text Item',
        DataType: 'Char',
        MaximumLength: 120,
        Prompt: 'Customer Name',
        Width: 180,
        Height: 22,
        Required: true,
        CanvasName: 'CV_CUSTOMER_MAIN',
        DatabaseItem: true,
      },
    },
    {
      type: 'ITEM',
      name: 'NAME',
      parentPath: ['CUSTOMER'],
      rawAttributes: {
        ItemType: 'Text Item',
        DataType: 'Char',
        MaximumLength: 80,
        Prompt: 'Customer Short Name',
        Width: 180,
        Height: 22,
        Required: true,
        CanvasName: 'CV_CUSTOMER_MAIN',
        DatabaseItem: true,
      },
    },
    {
      type: 'ITEM',
      name: 'EMAIL',
      parentPath: ['CUSTOMER'],
      rawAttributes: {
        ItemType: 'Text Item',
        DataType: 'Char',
        MaximumLength: 150,
        Prompt: 'Email Address',
        Width: 220,
        Height: 22,
        Required: true,
        CanvasName: 'CV_CUSTOMER_MAIN',
        DatabaseItem: true,
      },
    },
    {
      type: 'ITEM',
      name: 'CREDIT_LIMIT',
      parentPath: ['CUSTOMER'],
      rawAttributes: {
        ItemType: 'Text Item',
        DataType: 'Number',
        MaximumLength: 14,
        Prompt: 'Approved Credit Limit',
        Width: 115,
        Height: 22,
        Required: true,
        FormatMask: '9,999,990.00',
        CanvasName: 'CV_CUSTOMER_MAIN',
        DatabaseItem: true,
      },
    },
    {
      type: 'ITEM',
      name: 'TAX_REFERENCE',
      parentPath: ['CUSTOMER'],
      rawAttributes: {
        ItemType: 'Text Item',
        DataType: 'Char',
        MaximumLength: 30,
        Prompt: 'Tax Registration ID',
        Width: 145,
        Height: 22,
        ValidateFromList: true,
        LovName: 'LOV_TAX_JURISDICTION',
        CanvasName: 'CV_CUSTOMER_MAIN',
        DatabaseItem: true,
      },
    },
    {
      type: 'ITEM',
      name: 'STREET_LINE_1',
      parentPath: ['ADDRESS'],
      rawAttributes: {
        ItemType: 'Text Item',
        DataType: 'Char',
        MaximumLength: 120,
        Prompt: 'Street Address',
        Width: 240,
        Height: 22,
        Required: true,
        CanvasName: 'CV_TAB_DETAILS',
        DatabaseItem: true,
      },
    },
    {
      type: 'ITEM',
      name: 'CITY',
      parentPath: ['ADDRESS'],
      rawAttributes: {
        ItemType: 'Text Item',
        DataType: 'Char',
        MaximumLength: 60,
        Prompt: 'City',
        Width: 140,
        Height: 22,
        Required: true,
        CanvasName: 'CV_TAB_DETAILS',
        DatabaseItem: true,
      },
    },
    {
      type: 'ITEM',
      name: 'POSTAL_CODE',
      parentPath: ['ADDRESS'],
      rawAttributes: {
        ItemType: 'Text Item',
        DataType: 'Char',
        MaximumLength: 20,
        Prompt: 'Postal Code',
        Width: 90,
        Height: 22,
        Required: true,
        CanvasName: 'CV_TAB_DETAILS',
        DatabaseItem: true,
      },
    },
    // Triggers
    {
      type: 'TRIGGER',
      name: 'WHEN-BUTTON-PRESSED',
      parentPath: ['CUSTOMER'],
      rawAttributes: {
        ExecutionHierarchy: 'Override',
        FireInEnterQueryMode: false,
      },
      sourceType: 'PLSQL',
      sourceCode: `BEGIN
  validate_customer;
  validate_address;
  audit_customer_change(:CUSTOMER.CUSTOMER_ID);
  COMMIT_FORM;
END;`,
    },
    {
      type: 'TRIGGER',
      name: 'WHEN-VALIDATE-ITEM',
      parentPath: ['CUSTOMER', 'CUSTOMER_NAME'],
      rawAttributes: {
        ExecutionHierarchy: 'Before',
        FireInEnterQueryMode: false,
      },
      sourceType: 'PLSQL',
      sourceCode: `BEGIN
  IF :CUSTOMER.CUSTOMER_NAME IS NULL THEN
    MESSAGE('Customer full legal name is mandatory.');
    RAISE FORM_TRIGGER_FAILURE;
  END IF;
  :CUSTOMER.CUSTOMER_NAME := TRIM(:CUSTOMER.CUSTOMER_NAME);
  validate_kyc_Characters(:CUSTOMER.CUSTOMER_NAME);
END;`,
    },
    {
      type: 'TRIGGER',
      name: 'PRE-INSERT',
      parentPath: ['CUSTOMER'],
      rawAttributes: {
        ExecutionHierarchy: 'Before',
        FireInEnterQueryMode: false,
      },
      sourceType: 'PLSQL',
      sourceCode: `BEGIN
  SELECT ar_customers_s.NEXTVAL
    INTO :CUSTOMER.CUSTOMER_ID
    FROM dual;
  :CUSTOMER.CREATION_DATE := SYSDATE;
  :CUSTOMER.CREATED_BY := GET_APPLICATION_PROPERTY(USERNAME);
END;`,
    },
    // Program Units
    {
      type: 'PROGRAM_UNIT',
      name: 'VALIDATE_CUSTOMER',
      parentPath: [],
      rawAttributes: {
        ProgramUnitType: 'Procedure',
      },
      sourceType: 'PLSQL',
      sourceCode: `PROCEDURE validate_customer IS
BEGIN
  IF :CUSTOMER.CUSTOMER_NAME IS NULL THEN
    RAISE FORM_TRIGGER_FAILURE;
  END IF;

  IF :CUSTOMER.EMAIL IS NULL OR INSTR(:CUSTOMER.EMAIL, '@') = 0 THEN
    MESSAGE('A valid customer email address is required.');
    RAISE FORM_TRIGGER_FAILURE;
  END IF;

  IF NVL(:CUSTOMER.CREDIT_LIMIT, 0) < 0 THEN
    MESSAGE('Credit limit cannot be negative.');
    RAISE FORM_TRIGGER_FAILURE;
  END IF;
END validate_customer;`,
    },
    {
      type: 'PROGRAM_UNIT',
      name: 'VALIDATE_ADDRESS',
      parentPath: [],
      rawAttributes: {
        ProgramUnitType: 'Procedure',
      },
      sourceType: 'PLSQL',
      sourceCode: `PROCEDURE validate_address IS
BEGIN
  IF :ADDRESS.STREET_LINE_1 IS NULL OR :ADDRESS.POSTAL_CODE IS NULL THEN
    MESSAGE('Primary address street and postal code are required.');
    RAISE FORM_TRIGGER_FAILURE;
  END IF;
END validate_address;`,
    },
    {
      type: 'LOV',
      name: 'LOV_TAX_JURISDICTION',
      parentPath: [],
      rawAttributes: {
        Title: 'Select Tax Jurisdiction',
        RecordGroupName: 'RG_TAX_JURISDICTION',
        Width: 460,
        Height: 310,
        AutoRefresh: true,
      },
    },
  ];

  return {
    fileName: customFileName,
    fileSize: customSize,
    moduleName: 'CUSTOMER_FORM',
    formsVersion: '12.2.1.4.0',
    extractionMethod: 'frmf2xml',
    formAttributes: {
      Title: 'Customer & Address Master Form',
      ConsoleWindow: 'W_MAIN',
      FirstNavigationBlockName: 'CUSTOMER',
      ValidationUnit: 'Item',
      InteractionMode: 'Non-Blocking',
    },
    items: [...v2SpecificItems, ...baseItems],
  };
}

/**
 * 3-Way Merge Fixtures (BASE, OURS, THEIRS)
 * Designed to produce realistic automatic merges + 4 clear, instructive conflicts:
 * Conflict 1: CUSTOMER -> NAME -> Width (BASE: 150, OURS: 180, THEIRS: 200)
 * Conflict 2: CUSTOMER -> CUSTOMER_NAME -> Prompt (BASE: "Name", OURS: "Customer Name", THEIRS: "Client Name")
 * Conflict 3: TRIGGER -> CUSTOMER.WHEN-BUTTON-PRESSED -> PL/SQL Source
 * Conflict 4: ITEM -> CUSTOMER.CREDIT_LIMIT -> FormatMask
 */
export function getMergeBaseFixture(customFileName = 'customer_base.fmb'): RawExtractedFmb {
  return getCustomerV1Fixture(customFileName, 2485120);
}

export function getMergeOursFixture(customFileName = 'customer_ours.fmb'): RawExtractedFmb {
  const base = getCustomerV1Fixture(customFileName, 2641920);
  const items = base.items.map((item) => ({
    ...item,
    rawAttributes: { ...item.rawAttributes },
  }));

  const updateItem = (type: string, name: string, mutator: (it: RawExtractedItem) => void) => {
    const target = items.find((i) => i.type === type && i.name === name);
    if (target) mutator(target);
  };

  // Conflict 1: CUSTOMER.NAME Width: Base=150, Ours=180, Theirs=200
  updateItem('ITEM', 'NAME', (it) => {
    it.rawAttributes.Width = 180;
    // Identical change in both OURS and THEIRS (can be auto-resolved!)
    it.rawAttributes.MaximumLength = 80;
  });

  // Conflict 2: CUSTOMER.CUSTOMER_NAME Prompt: Base="Name", Ours="Customer Name", Theirs="Client Name"
  updateItem('ITEM', 'CUSTOMER_NAME', (it) => {
    it.rawAttributes.Prompt = 'Customer Name';
    it.rawAttributes.Width = 180; // OURS-only change
    it.rawAttributes.MaximumLength = 120; // OURS-only change
  });

  // Conflict 3: TRIGGER WHEN-BUTTON-PRESSED source
  updateItem('TRIGGER', 'WHEN-BUTTON-PRESSED', (it) => {
    it.sourceCode = `BEGIN
  validate_customer;
  validate_address;
  COMMIT_FORM;
END;`;
  });

  // Conflict 4: CUSTOMER.CREDIT_LIMIT FormatMask
  updateItem('ITEM', 'CREDIT_LIMIT', (it) => {
    it.rawAttributes.FormatMask = '9,999,990.00';
    it.rawAttributes.Required = true; // Identical change in both OURS and THEIRS
    it.rawAttributes.Width = 115; // OURS-only change
  });

  // Auto-mergeable OURS-only changes
  updateItem('BLOCK', 'CUSTOMER', (it) => {
    it.rawAttributes.DeleteAllowed = false;
  });

  updateItem('ITEM', 'TAX_REFERENCE', (it) => {
    it.rawAttributes.ValidateFromList = true;
    it.rawAttributes.LovName = 'LOV_TAX_JURISDICTION';
    it.rawAttributes.Width = 145;
  });

  updateItem('TRIGGER', 'PRE-INSERT', (it) => {
    it.sourceCode = `BEGIN
  SELECT ar_customers_s.NEXTVAL
    INTO :CUSTOMER.CUSTOMER_ID
    FROM dual;
  :CUSTOMER.CREATION_DATE := SYSDATE;
  :CUSTOMER.CREATED_BY := GET_APPLICATION_PROPERTY(USERNAME);
END;`;
  });

  // Added object in OURS
  items.push({
    type: 'ITEM',
    name: 'EMAIL',
    parentPath: ['CUSTOMER'],
    rawAttributes: {
      ItemType: 'Text Item',
      DataType: 'Char',
      MaximumLength: 150,
      Prompt: 'Email Address',
      Width: 220,
      Height: 22,
      Required: true,
      CanvasName: 'CV_CUSTOMER_MAIN',
      DatabaseItem: true,
    },
  });

  items.push({
    type: 'BLOCK',
    name: 'ADDRESS',
    parentPath: [],
    rawAttributes: {
      DatabaseDataBlock: true,
      QueryDataSourceName: 'AR_CUSTOMER_ADDRESSES',
      RecordsDisplayed: 4,
      QueryAllowed: true,
      InsertAllowed: true,
      UpdateAllowed: true,
      DeleteAllowed: false,
    },
  });

  items.push({
    type: 'ITEM',
    name: 'STREET_LINE_1',
    parentPath: ['ADDRESS'],
    rawAttributes: {
      ItemType: 'Text Item',
      DataType: 'Char',
      MaximumLength: 120,
      Prompt: 'Street Address',
      Width: 240,
      Height: 22,
      Required: true,
      CanvasName: 'CV_TAB_DETAILS',
      DatabaseItem: true,
    },
  });

  return {
    ...base,
    items,
  };
}

export function getMergeTheirsFixture(customFileName = 'customer_theirs.fmb'): RawExtractedFmb {
  const base = getCustomerV1Fixture(customFileName, 2610400);
  const items = base.items
    .filter((i) => !(i.type === 'ITEM' && i.name === 'OLD_CODE')) // Removed in THEIRS
    .map((item) => ({
      ...item,
      rawAttributes: { ...item.rawAttributes },
    }));

  const updateItem = (type: string, name: string, mutator: (it: RawExtractedItem) => void) => {
    const target = items.find((i) => i.type === type && i.name === name);
    if (target) mutator(target);
  };

  // Conflict 1: CUSTOMER.NAME Width: Base=150, Ours=180, Theirs=200
  updateItem('ITEM', 'NAME', (it) => {
    it.rawAttributes.Width = 200;
    // Identical change in both OURS and THEIRS
    it.rawAttributes.MaximumLength = 80;
  });

  // Conflict 2: CUSTOMER.CUSTOMER_NAME Prompt: Base="Name", Ours="Customer Name", Theirs="Client Name"
  updateItem('ITEM', 'CUSTOMER_NAME', (it) => {
    it.rawAttributes.Prompt = 'Client Name';
  });

  // Conflict 3: TRIGGER WHEN-BUTTON-PRESSED source
  updateItem('TRIGGER', 'WHEN-BUTTON-PRESSED', (it) => {
    it.sourceCode = `BEGIN
  validate_customer;
  check_credit_exposure(:CUSTOMER.CUSTOMER_ID);
  COMMIT_FORM;
END;`;
  });

  // Conflict 4: CUSTOMER.CREDIT_LIMIT FormatMask
  updateItem('ITEM', 'CREDIT_LIMIT', (it) => {
    it.rawAttributes.FormatMask = '99,999,990.00';
    it.rawAttributes.Required = true; // Identical change in both OURS and THEIRS
  });

  // Auto-mergeable THEIRS-only changes
  updateItem('WINDOW', 'W_MAIN', (it) => {
    it.rawAttributes.Title = 'Enterprise Customer & Credit Maintenance';
    it.rawAttributes.Width = 1120;
  });

  updateItem('CANVAS', 'CV_CUSTOMER_MAIN', (it) => {
    it.rawAttributes.Width = 1120;
    it.rawAttributes.ViewportWidth = 1120;
  });

  updateItem('PROGRAM_UNIT', 'VALIDATE_CUSTOMER', (it) => {
    it.sourceCode = `PROCEDURE validate_customer IS
BEGIN
  IF :CUSTOMER.CUSTOMER_NAME IS NULL THEN
    RAISE FORM_TRIGGER_FAILURE;
  END IF;

  IF NVL(:CUSTOMER.CREDIT_LIMIT, 0) < 0 THEN
    MESSAGE('Credit limit cannot be negative.');
    RAISE FORM_TRIGGER_FAILURE;
  END IF;

  ar_credit_pkg.verify_standing(:CUSTOMER.CUSTOMER_ID);
END validate_customer;`;
  });

  // Added object in THEIRS
  items.push({
    type: 'PROGRAM_UNIT',
    name: 'CHECK_CREDIT_EXPOSURE',
    parentPath: [],
    rawAttributes: {
      ProgramUnitType: 'Procedure',
    },
    sourceType: 'PLSQL',
    sourceCode: `PROCEDURE check_credit_exposure(p_cust_id IN NUMBER) IS
BEGIN
  IF p_cust_id IS NOT NULL THEN
    ar_credit_pkg.enforce_hold_if_overdue(p_cust_id);
  END IF;
END check_credit_exposure;`,
  });

  return {
    ...base,
    items,
  };
}
