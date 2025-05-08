import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    // For now, just log errors and continue
    return Promise.reject(error);
  }
);

// Mock implementations for development
const mockApi = {
  get: async (url) => {
    console.log(`Mocking GET request to ${url}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock responses based on URL
    if (url.startsWith('/environmental/assets/')) {
      const assetId = url.split('/').pop();
      return { data: mockEnvironmentalAsset(assetId) };
    }
    
    if (url === '/environmental/assets') {
      return { data: { assets: mockEnvironmentalAssets() } };
    }
    
    throw new Error(`No mock response for ${url}`);
  },
  
  post: async (url, data) => {
    console.log(`Mocking POST request to ${url}`, data);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock responses based on URL
    if (url === '/yield/strategies/sustainable') {
      return { data: { strategies: mockSustainableStrategies() } };
    }
    
    if (url === '/yield/strategies/impact') {
      return { data: mockStrategyImpact(data.strategy_id) };
    }
    
    throw new Error(`No mock response for ${url}`);
  }
};

// Helper function to generate mock environment asset
function mockEnvironmentalAsset(assetId) {
  // Define specific assets by ID (these match the ones in MarketplacePage.js)
  if (assetId === '0x5f0f0e0d0c0b0a09080706050403020100000005') {
    // Amazon Rainforest Carbon Credits
    return {
      asset_id: assetId,
      asset_type: 'CarbonCredit',
      standard: 'Verra',
      vintage_year: 2023,
      project_id: 'VCS-987654',
      project_name: 'Amazon Rainforest Conservation Initiative',
      project_location: 'Amazon, Brazil',
      verification_status: 'Verified',
      verification_date: Math.floor(Date.now() / 1000) - 7776000, // 90 days ago
      registry_link: 'https://registry.verra.org/app/projectDetail/VCS/987654',
      metadata_uri: 'ipfs://QmYVxS7LnrUyTD8uhdLZkwrC3romw7ZVEALeAGuTNrSJCR',
      impact_metrics: {
        carbon_offset_tons: 750000,
        land_area_protected_hectares: 45000,
        renewable_energy_mwh: 0,
        water_protected_liters: 7500000000,
        sdg_alignment: {
          "13": 0.95, // Climate Action
          "15": 0.90, // Life on Land
          "6": 0.70,  // Clean Water and Sanitation
        },
        verification_date: Math.floor(Date.now() / 1000) - 7776000,
        third_party_verifier: 'Bureau Veritas',
      },
      issuance_date: Math.floor(Date.now() / 1000) - 8000000,
      expiration_date: Math.floor(Date.now() / 1000) + 31536000, // 1 year from now
      retired: false,
      total_supply: '750000',
      available_supply: '650000',
      description: 'The Amazon Rainforest Conservation Initiative focuses on protecting critical primary forest in the heart of the Brazilian Amazon. This REDD+ project prevents deforestation through community engagement, sustainable livelihoods, and enhanced monitoring. Each credit represents one metric ton of verified CO2 emissions reduction.',
      price_per_unit: '24.75',
      image_url: 'https://images.pexels.com/photos/955657/pexels-photo-955657.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      project_developer: 'Conservation International',
      methodology: 'VM0015 - REDD+ Methodology',
      co_benefits: [
        'Biodiversity conservation',
        'Indigenous community support',
        'Watershed protection',
        'Sustainable employment',
        'Education programs'
      ],
      certification_documents: [
        { name: 'Project Design Document', url: '#pdd' },
        { name: 'Validation Report', url: '#validation' },
        { name: 'Monitoring Report', url: '#monitoring' },
        { name: 'Verification Statement', url: '#verification' },
        { name: 'Registration Statement', url: '#registration' }
      ],
      security_details: {
        token_standard: 'ERC-1155',
        contract_address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        blockchain: 'Ethereum',
        token_id: '5',
        marketplace_url: '/marketplace'
      }
    };
  }
  
  if (assetId === '0x5f0f0e0d0c0b0a09080706050403020100000006') {
    // Blue Carbon Mangrove Credits
    return {
      asset_id: assetId,
      asset_type: 'BiodiversityCredit',
      standard: 'Gold Standard',
      vintage_year: 2023,
      project_id: 'GS-123456',
      project_name: 'Blue Carbon Mangrove Restoration',
      project_location: 'Sundarban Delta, Bangladesh',
      verification_status: 'Verified',
      verification_date: Math.floor(Date.now() / 1000) - 5184000, // 60 days ago
      registry_link: 'https://registry.goldstandard.org/projects/details/123456',
      metadata_uri: 'ipfs://QmZbv9Ry7BVpFwnYYVQRKV5hH2GLd95S9LpJ5XKx9yCZSF',
      impact_metrics: {
        carbon_offset_tons: 350000,
        land_area_protected_hectares: 12000,
        renewable_energy_mwh: 0,
        water_protected_liters: 15000000000,
        sdg_alignment: {
          "13": 0.85, // Climate Action
          "14": 0.95, // Life Below Water
          "15": 0.80, // Life on Land
          "6": 0.75,  // Clean Water and Sanitation
          "1": 0.70   // No Poverty
        },
        verification_date: Math.floor(Date.now() / 1000) - 5184000,
        third_party_verifier: 'SCS Global Services',
      },
      issuance_date: Math.floor(Date.now() / 1000) - 6000000,
      expiration_date: Math.floor(Date.now() / 1000) + 31536000, // 1 year from now
      retired: false,
      total_supply: '350000',
      available_supply: '300000',
      description: 'The Blue Carbon Mangrove Restoration project focuses on rehabilitating degraded mangrove ecosystems in the Sundarban Delta. Mangroves sequester up to five times more carbon than terrestrial forests and protect coastal communities from storms and erosion. Each credit represents both carbon sequestration and biodiversity protection metrics.',
      price_per_unit: '18.50',
      image_url: 'https://images.pexels.com/photos/11842913/pexels-photo-11842913.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      project_developer: 'Blue Carbon Initiative',
      methodology: 'VM0033 - Tidal Wetland and Seagrass Restoration',
      co_benefits: [
        'Coastal erosion protection',
        'Storm surge mitigation',
        'Marine habitat restoration',
        'Local fishery enhancement',
        'Community-based restoration jobs',
        'Ecotourism development'
      ],
      certification_documents: [
        { name: 'Project Design Document', url: '#pdd' },
        { name: 'Methodology Application', url: '#methodology' },
        { name: 'Validation Report', url: '#validation' },
        { name: 'Monitoring Report', url: '#monitoring' },
        { name: 'Verification Statement', url: '#verification' }
      ],
      security_details: {
        token_standard: 'ERC-1155',
        contract_address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        blockchain: 'Ethereum',
        token_id: '6',
        marketplace_url: '/marketplace'
      }
    };
  }
  
  // Default mock asset for other IDs
  return {
    asset_id: assetId,
    asset_type: 'CarbonCredit',
    standard: 'Verra',
    vintage_year: 2022,
    project_id: 'VCS-123456',
    project_name: 'Rainforest Conservation Project',
    project_location: 'Amazon, Brazil',
    verification_status: 'Verified',
    verification_date: 1672531200, // Jan 1, 2023
    registry_link: 'https://registry.verra.org/app/projectDetail/VCS/123456',
    metadata_uri: 'ipfs://Qm...',
    impact_metrics: {
      carbon_offset_tons: 150.5,
      land_area_protected_hectares: 25.0,
      renewable_energy_mwh: 0.0,
      water_protected_liters: 0.0,
      sdg_alignment: {
        "13": 0.9, // Climate Action
        "15": 0.8, // Life on Land
      },
      verification_date: 1672531200, // Jan 1, 2023
      third_party_verifier: 'Verification Co.',
    },
    issuance_date: 1672531200, // Jan 1, 2023
    expiration_date: 1704067200, // Jan 1, 2024
    retired: false,
    total_supply: '1000',
    available_supply: '800',
    description: 'This conservation project protects critical rainforest habitat in the Amazon Basin. It prevents deforestation and supports biodiversity conservation while engaging local communities in sustainable livelihood activities.',
    price_per_unit: '25.50', // USD
    image_url: 'https://source.unsplash.com/featured/600x400?rainforest',
    project_developer: 'Green Conservation Partners',
    methodology: 'VM0015 - REDD Methodology',
    co_benefits: [
      'Biodiversity protection',
      'Community development',
      'Water conservation',
    ],
    certification_documents: [
      { name: 'Validation Report', url: '#' },
      { name: 'Monitoring Report', url: '#' },
      { name: 'Verification Statement', url: '#' },
    ]
  };
}

// Helper function to generate mock environmental assets list
function mockEnvironmentalAssets() {
  return [
    mockEnvironmentalAsset('0x5f0f0e0d0c0b0a09080706050403020100000005'),
    mockEnvironmentalAsset('0x5f0f0e0d0c0b0a09080706050403020100000006'),
    // Add more mock assets if needed
  ];
}

// Helper functions for yield strategies
function mockSustainableStrategies() {
  return [
    {
      strategy_id: '0x0000000000000000000000000000000000000000000000000000000000000001',
      name: 'Carbon Credits Yield Optimizer',
      description: 'High-impact strategy that optimizes yield while automatically retiring a portion of carbon credits to maximize environmental impact.',
      risk_level: 'MODERATE',
      is_public: true,
      is_active: true,
      creation_date: 1646092800,
      performance_fee: '200',
      metadata_uri: 'ipfs://Qm...',
      environmental_metadata: {
        asset_type: 'CarbonCredit',
        certification_standard: 'Verra',
        impact_multiplier: '120',
        carbon_negative: true,
        retirement_percentage: '20',
        sdg_alignment: {
          '13': '90',
          '15': '80',
        }
      }
    },
    {
      strategy_id: '0x0000000000000000000000000000000000000000000000000000000000000002',
      name: 'Biodiversity Protection Yield',
      description: 'Strategy focused on biodiversity credits with automatic compounding and partial retirement to fund conservation projects.',
      risk_level: 'CONSERVATIVE',
      is_public: true,
      is_active: true,
      creation_date: 1651449600,
      performance_fee: '150',
      metadata_uri: 'ipfs://Qm...',
      environmental_metadata: {
        asset_type: 'BiodiversityCredit',
        certification_standard: 'Gold Standard',
        impact_multiplier: '130',
        carbon_negative: false,
        retirement_percentage: '15',
        sdg_alignment: {
          '14': '95',
          '15': '90',
        }
      }
    },
    {
      strategy_id: '0x0000000000000000000000000000000000000000000000000000000000000003',
      name: 'Renewable Energy Certificate Optimizer',
      description: 'Focuses on maximizing yield from renewable energy certificates while supporting new clean energy projects.',
      risk_level: 'AGGRESSIVE',
      is_public: true,
      is_active: true,
      creation_date: 1656633600,
      performance_fee: '300',
      metadata_uri: 'ipfs://Qm...',
      environmental_metadata: {
        asset_type: 'RenewableEnergyCertificate',
        certification_standard: 'I-REC',
        impact_multiplier: '110',
        carbon_negative: true,
        retirement_percentage: '10',
        sdg_alignment: {
          '7': '95',
          '9': '75',
          '13': '85',
        }
      }
    },
  ];
}

function mockStrategyImpact(strategyId) {
  return {
    strategy_id: strategyId,
    strategy_name: 'Carbon Credits Yield Optimizer',
    investment_amount: '1000',
    duration_days: '365',
    impact_metrics: {
      carbon_offset_tons: '12',
      land_area_protected_hectares: '2',
      renewable_energy_mwh: '25',
      auto_retired_credits: '200'
    },
    environmental_metadata: {
      asset_type: 'CarbonCredit',
      certification_standard: 'Verra',
      impact_multiplier: '120',
      carbon_negative: true,
      retirement_percentage: '20',
    }
  };
}

// Use the mock API for now
export default mockApi; 