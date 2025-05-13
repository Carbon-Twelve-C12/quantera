export interface TreasuryDetail {
  token_id: string;
  token_address: string;
  name: string;
  symbol: string;
  description: string;
  treasury_type: string;
  total_supply: string;
  yield_rate: number;
  maturity_date: number;
  current_price: string;
  status: string;
  issuer: string;
  issuer_description: string;
  auction_date: number;
  settlement_date: number;
  face_value: string;
  minimum_bid: string;
  issuance_size: string;
  custody_fee: number;
  liquidity_rating: 'High' | 'Medium' | 'Low';
  risk_rating: 'AAA' | 'AA+' | 'AA' | 'AA-' | 'A+' | 'A';
  historical_prices: { date: number; price: string }[];
  recent_trades: { 
    date: number;
    quantity: string;
    price: string;
    type: 'Buy' | 'Sell';
  }[];
  similar_treasuries: string[];
  documents: {
    name: string;
    url: string;
    type: 'PDF' | 'DOC' | 'TXT';
    size_kb: number;
  }[];
}

export interface EnvironmentalAsset {
  asset_id: string;
  asset_type: string;
  standard: string;
  vintage_year: number;
  project_id: string;
  project_name: string;
  project_location: string;
  country: string;
  region?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  verification_status: 'Verified' | 'Pending' | 'Rejected';
  verification_date: number;
  registry_link?: string;
  metadata_uri?: string;
  impact_metrics: {
    carbon_offset_tons: number;
    land_area_protected_hectares: number;
    renewable_energy_mwh: number;
    water_protected_liters: number;
    biodiversity_species_protected?: number;
    local_communities_supported?: number;
    jobs_created?: number;
    sdg_alignment?: {
      [key: string]: number;
    };
    verification_date?: number;
    third_party_verifier: string;
  };
  issuance_date?: number;
  expiration_date?: number;
  retired?: boolean;
  retirement_details?: {
    retirement_date: number;
    retirement_reason: string;
    retirement_beneficiary: string;
  };
  total_supply: string;
  available_supply: string;
  description: string;
  long_description?: string;
  price_per_unit: string;
  change_24h?: string;
  volume_24h?: string;
  image_url: string;
  gallery_images?: string[];
  project_developer?: string;
  methodology?: string;
  methodology_details?: string;
  co_benefits?: string[];
  risks?: {
    name: string;
    description: string;
    severity: 'Low' | 'Medium' | 'High';
  }[];
  certification_documents?: {
    name: string;
    url: string;
    type?: string;
    size_kb?: number;
  }[];
  project_updates?: {
    date: number;
    title: string;
    content: string;
    author: string;
  }[];
  security_details: {
    token_standard: string;
    contract_address: string;
    blockchain: string;
    token_id: string;
    marketplace_url: string;
  };
  similar_projects?: string[];
} 