import { AssetClass, AssetTemplate } from '../types/assetTypes';

// Shared creator address for templates
const TEMPLATE_CREATOR = '0x1234567890123456789012345678901234567890';
const now = Math.floor(Date.now() / 1000);

// Default modules available across most templates
const DEFAULT_MODULES = [
  'compliance-standard',
  'transfer-restrictions',
  'kyc-aml',
  'reporting'
];

// TOKENIZED SECURITIES TEMPLATES
export const tokenizedSecuritiesTemplates: AssetTemplate[] = [
  {
    templateId: 'ts-equity-001',
    name: 'Tokenized Equity Shares',
    assetClass: AssetClass.CORPORATE_BOND,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 100 * 86400, // 100 days ago
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/equity',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'dividend-distribution',
      'voting-rights',
      'shareholder-registry'
    ]
  },
  {
    templateId: 'ts-etf-001',
    name: 'Tokenized ETF',
    assetClass: AssetClass.CORPORATE_BOND,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 95 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/etf',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'nav-calculation',
      'rebalancing',
      'basket-composition'
    ]
  },
  {
    templateId: 'ts-security-001',
    name: 'SEC-Compliant Security Token',
    assetClass: AssetClass.CORPORATE_BOND,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 90 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/security',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'accredited-investor',
      'transfer-lockup',
      'offering-compliance',
      'holding-period'
    ]
  }
];

// REAL ESTATE TOKENS TEMPLATES
export const realEstateTemplates: AssetTemplate[] = [
  {
    templateId: 're-fractionalized-001',
    name: 'Fractionalized Property',
    assetClass: AssetClass.REAL_ESTATE,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 85 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/realestate-fractional',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'rental-distribution',
      'property-management',
      'value-appreciation',
      'insurance'
    ]
  },
  {
    templateId: 're-reit-001',
    name: 'Tokenized REIT',
    assetClass: AssetClass.REAL_ESTATE,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 80 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/reit',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'quarterly-dividend',
      'portfolio-management',
      'diversification-rules',
      'reit-compliance'
    ]
  },
  {
    templateId: 're-commercial-001',
    name: 'Commercial Real Estate',
    assetClass: AssetClass.REAL_ESTATE,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 75 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/commercial',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'tenant-management',
      'lease-automation',
      'occupancy-tracking',
      'property-expenses'
    ]
  }
];

// FUND TOKENS TEMPLATES
export const fundTokenTemplates: AssetTemplate[] = [
  {
    templateId: 'fund-hedge-001',
    name: 'Hedge Fund Token',
    assetClass: AssetClass.CUSTOM,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 70 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/hedgefund',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'redemption-window',
      'performance-fee',
      'nav-calculation',
      'investor-limits'
    ]
  },
  {
    templateId: 'fund-private-001',
    name: 'Private Equity Fund',
    assetClass: AssetClass.CUSTOM,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 65 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/privateequity',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'capital-calls',
      'distribution-waterfall',
      'lockup-period',
      'commitment-tracking'
    ]
  },
  {
    templateId: 'fund-mutual-001',
    name: 'Mutual Fund Token',
    assetClass: AssetClass.CUSTOM,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 60 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/mutualfund',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'daily-nav',
      'continuous-offering',
      'prospectus-compliance',
      'fund-expenses'
    ]
  }
];

// ENVIRONMENTAL ASSETS TEMPLATES
export const environmentalAssetTemplates: AssetTemplate[] = [
  {
    templateId: 'env-carbon-001',
    name: 'Carbon Credit',
    assetClass: AssetClass.ENVIRONMENTAL_ASSET,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 55 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/carbon',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'verification-standard',
      'retirement-mechanism',
      'impact-tracking',
      'vintage-registry'
    ]
  },
  {
    templateId: 'env-biodiversity-001',
    name: 'Biodiversity Credit',
    assetClass: AssetClass.ENVIRONMENTAL_ASSET,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 50 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/biodiversity',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'ecological-metrics',
      'habitat-verification',
      'impact-calculation',
      'conservation-rules'
    ]
  },
  {
    templateId: 'env-rec-001',
    name: 'Renewable Energy Certificate',
    assetClass: AssetClass.ENVIRONMENTAL_ASSET,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 45 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/rec',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'energy-source-verification',
      'mwh-tracking',
      'grid-connection-proof',
      'regulatory-compliance'
    ]
  }
];

// FIXED INCOME TEMPLATES
export const fixedIncomeTemplates: AssetTemplate[] = [
  {
    templateId: 'fi-tbill-001',
    name: 'Treasury Bill',
    assetClass: AssetClass.TREASURY,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 40 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/tbill',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'maturity-date',
      'face-value',
      'discount-rate',
      'redemption'
    ]
  },
  {
    templateId: 'fi-tnote-001',
    name: 'Treasury Note',
    assetClass: AssetClass.TREASURY,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 35 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/tnote',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'coupon-payment',
      'semi-annual-interest',
      'maturity-date',
      'face-value'
    ]
  },
  {
    templateId: 'fi-bond-001',
    name: 'Corporate Bond',
    assetClass: AssetClass.CORPORATE_BOND,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 30 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/corpbond',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'coupon-payment',
      'interest-rate',
      'creditor-ranking',
      'default-protection'
    ]
  }
];

// TRADE FINANCE TEMPLATES
export const tradeFinanceTemplates: AssetTemplate[] = [
  {
    templateId: 'tf-loc-001',
    name: 'Letter of Credit',
    assetClass: AssetClass.INVOICE,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 25 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/loc',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'shipment-verification',
      'document-presentation',
      'payment-terms',
      'expiry-date'
    ]
  },
  {
    templateId: 'tf-invoice-001',
    name: 'Invoice Receivable',
    assetClass: AssetClass.INVOICE,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 20 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/invoice',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'invoice-verification',
      'payment-due-date',
      'early-payment-discount',
      'recourse-options'
    ]
  },
  {
    templateId: 'tf-warehouse-001',
    name: 'Warehouse Receipt',
    assetClass: AssetClass.COMMODITY,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 15 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/warehouse',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'commodity-verification',
      'storage-conditions',
      'quality-inspection',
      'release-conditions'
    ]
  },
  {
    templateId: 'tf-supplychain-001',
    name: 'Supply Chain Finance',
    assetClass: AssetClass.INVOICE,
    creator: TEMPLATE_CREATOR,
    creationDate: now - 10 * 86400,
    isPublic: true,
    metadataURI: 'ipfs://Qm123456789/supplychain',
    compatibleModules: [
      ...DEFAULT_MODULES,
      'supplier-verification',
      'buyer-confirmation',
      'payment-terms',
      'dynamic-discounting'
    ]
  }
];

// Function to get all templates for a given asset class
export const getMockTemplatesByClass = (assetClass: AssetClass): AssetTemplate[] => {
  switch (assetClass) {
    case AssetClass.TREASURY:
      return fixedIncomeTemplates.filter(t => t.assetClass === AssetClass.TREASURY);
    
    case AssetClass.REAL_ESTATE:
      return realEstateTemplates;
    
    case AssetClass.CORPORATE_BOND:
      return [
        ...tokenizedSecuritiesTemplates.filter(t => t.assetClass === AssetClass.CORPORATE_BOND),
        ...fixedIncomeTemplates.filter(t => t.assetClass === AssetClass.CORPORATE_BOND)
      ];
    
    case AssetClass.ENVIRONMENTAL_ASSET:
      return environmentalAssetTemplates;
    
    case AssetClass.INVOICE:
      return tradeFinanceTemplates.filter(t => t.assetClass === AssetClass.INVOICE);
    
    case AssetClass.COMMODITY:
      return tradeFinanceTemplates.filter(t => t.assetClass === AssetClass.COMMODITY);
    
    case AssetClass.CUSTOM:
      return fundTokenTemplates;
    
    default:
      return [];
  }
};

// All templates combined
export const allTemplates: AssetTemplate[] = [
  ...tokenizedSecuritiesTemplates,
  ...realEstateTemplates,
  ...fundTokenTemplates,
  ...environmentalAssetTemplates,
  ...fixedIncomeTemplates,
  ...tradeFinanceTemplates
]; 