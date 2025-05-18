/**
 * Mock Real Estate Assets Data
 * 
 * This file contains mock data for real estate assets to be displayed in the marketplace.
 * In a production environment, this would be replaced with API calls to fetch real data.
 */

export const realEstateAssets = [
  {
    asset_id: 're-001',
    project_name: 'Skyline Tower Commercial',
    description: 'Class A commercial office building in downtown Chicago. Fully leased to multiple Fortune 500 tenants with an average remaining lease term of 7.5 years.',
    asset_type: 'CommercialProperty',
    property_type: 'Office',
    location: {
      address: '500 W Madison St',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      coordinates: {
        latitude: 41.882145,
        longitude: -87.639256
      }
    },
    size: {
      square_feet: 250000,
      floors: 28
    },
    price_per_unit: '500',
    total_units: 10000,
    minimum_investment: 2,
    occupancy_rate: 94.5,
    annual_return: 7.25,
    property_manager: 'Urban Core Management',
    image_url: '/images/assets/skyline-tower.jpg',
    documents: {
      appraisal: 'QmHash123456789appraisal',
      title: 'QmHash123456789title', 
      inspection: 'QmHash123456789inspection'
    },
    security_details: {
      token_standard: 'ERC-1155',
      contract_address: '0x1234567890123456789012345678901234567890'
    },
    legal_structure: 'Real Estate Investment Trust (REIT)',
    status: 'Active',
    change_24h: '+0.75%'
  },
  {
    asset_id: 're-002',
    project_name: 'Sunnyvale Residential Complex',
    description: 'Modern multi-family residential complex in Austin, TX. 200 luxury units with premium amenities including pool, fitness center, and co-working spaces.',
    asset_type: 'ResidentialProperty',
    property_type: 'Multi-family',
    location: {
      address: '3000 Riverside Dr',
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      coordinates: {
        latitude: 30.257625,
        longitude: -97.763267
      }
    },
    size: {
      square_feet: 180000,
      units: 200
    },
    price_per_unit: '250',
    total_units: 20000,
    minimum_investment: 4,
    occupancy_rate: 97.2,
    annual_return: 8.5,
    property_manager: 'TechCity Housing',
    image_url: '/images/assets/sunnyvale-residential.jpg',
    documents: {
      appraisal: 'QmHash223456789appraisal',
      title: 'QmHash223456789title', 
      inspection: 'QmHash223456789inspection'
    },
    security_details: {
      token_standard: 'ERC-1155',
      contract_address: '0x2345678901234567890123456789012345678901'
    },
    legal_structure: 'Limited Liability Company (LLC)',
    status: 'Active',
    change_24h: '+1.25%'
  },
  {
    asset_id: 're-003',
    project_name: 'Green Valley Industrial Park',
    description: 'Modern logistics and industrial complex located in Atlanta\'s key distribution corridor. State-of-the-art facilities with excellent highway access and environmental features.',
    asset_type: 'IndustrialProperty',
    property_type: 'Logistics',
    location: {
      address: '2500 Fulton Industrial Blvd',
      city: 'Atlanta',
      state: 'GA',
      country: 'USA',
      coordinates: {
        latitude: 33.772545,
        longitude: -84.551111
      }
    },
    size: {
      square_feet: 500000,
      buildings: 4
    },
    price_per_unit: '350',
    total_units: 15000,
    minimum_investment: 3,
    occupancy_rate: 100,
    annual_return: 6.8,
    property_manager: 'Industrial Partners Group',
    image_url: '/images/assets/industrial-park.jpg',
    documents: {
      appraisal: 'QmHash323456789appraisal',
      title: 'QmHash323456789title', 
      inspection: 'QmHash323456789inspection'
    },
    security_details: {
      token_standard: 'ERC-1155',
      contract_address: '0x3456789012345678901234567890123456789012'
    },
    legal_structure: 'Delaware Statutory Trust (DST)',
    status: 'Active',
    change_24h: '+0.35%'
  },
  {
    asset_id: 're-004',
    project_name: 'Retail Plaza at Oakwood',
    description: 'Premium retail shopping center in a high-traffic suburban area. Anchored by national retailers with strong long-term leases and substantial foot traffic.',
    asset_type: 'RetailProperty',
    property_type: 'Shopping Center',
    location: {
      address: '1200 Oakwood Ave',
      city: 'San Diego',
      state: 'CA',
      country: 'USA',
      coordinates: {
        latitude: 32.715738,
        longitude: -117.161083
      }
    },
    size: {
      square_feet: 175000,
      retail_units: 25
    },
    price_per_unit: '280',
    total_units: 18000,
    minimum_investment: 5,
    occupancy_rate: 92.8,
    annual_return: 7.4,
    property_manager: 'Coastal Retail Management',
    image_url: '/images/assets/retail-plaza.jpg',
    documents: {
      appraisal: 'QmHash423456789appraisal',
      title: 'QmHash423456789title', 
      inspection: 'QmHash423456789inspection'
    },
    security_details: {
      token_standard: 'ERC-1155',
      contract_address: '0x4567890123456789012345678901234567890123'
    },
    legal_structure: 'Limited Partnership (LP)',
    status: 'Active',
    change_24h: '-0.25%'
  },
  {
    asset_id: 're-005',
    project_name: 'Miami Beachfront Hotel',
    description: 'Luxury beachfront hotel property in Miami Beach with 200 rooms, restaurant, bar, and conference facilities. Recently renovated with high occupancy rates year-round.',
    asset_type: 'HospitalityProperty',
    property_type: 'Hotel',
    location: {
      address: '7500 Collins Ave',
      city: 'Miami Beach',
      state: 'FL',
      country: 'USA',
      coordinates: {
        latitude: 25.855763,
        longitude: -80.120245
      }
    },
    size: {
      square_feet: 220000,
      rooms: 200
    },
    price_per_unit: '650',
    total_units: 12000,
    minimum_investment: 2,
    occupancy_rate: 89.5,
    annual_return: 9.2,
    property_manager: 'Luxury Hospitality Group',
    image_url: '/images/assets/beachfront-hotel.jpg',
    documents: {
      appraisal: 'QmHash523456789appraisal',
      title: 'QmHash523456789title', 
      inspection: 'QmHash523456789inspection'
    },
    security_details: {
      token_standard: 'ERC-1155',
      contract_address: '0x5678901234567890123456789012345678901234'
    },
    legal_structure: 'Real Estate Investment Trust (REIT)',
    status: 'Active',
    change_24h: '+1.85%'
  },
  {
    asset_id: 're-006',
    project_name: 'Harbor District Mixed-Use Development',
    description: 'Premium mixed-use development in Seattle\'s revitalized harbor district featuring retail spaces, luxury condominiums, and boutique office spaces with waterfront views and sustainable design.',
    asset_type: 'MixedUseProperty',
    property_type: 'Mixed-Use',
    location: {
      address: '1800 Alaskan Way',
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
      coordinates: {
        latitude: 47.606209,
        longitude: -122.342072
      }
    },
    size: {
      square_feet: 325000,
      residential_units: 120,
      retail_spaces: 15,
      office_suites: 25
    },
    price_per_unit: '420',
    total_units: 15000,
    minimum_investment: 2,
    occupancy_rate: 91.5,
    annual_return: 8.2,
    property_manager: 'Pacific Northwest Properties',
    image_url: '/images/assets/harbor-district.jpg',
    documents: {
      appraisal: 'QmHash623456789appraisal',
      title: 'QmHash623456789title', 
      inspection: 'QmHash623456789inspection'
    },
    security_details: {
      token_standard: 'ERC-1155',
      contract_address: '0x6789012345678901234567890123456789012345'
    },
    legal_structure: 'Real Estate Investment Trust (REIT)',
    status: 'Active',
    change_24h: '+1.05%'
  }
]; 