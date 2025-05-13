import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/api';
import { StrategiesResponse, UserStrategiesResponse } from '../api/api';

// Types for yield strategies
export interface YieldStrategy {
  strategy_id: string;
  name: string;
  description: string;
  risk_level: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  is_public: boolean;
  is_active: boolean;
  creation_date: number;
  performance_fee: string;
  metadata_uri: string;
  asset_class?: number;
  annual_yield_percentage?: string;
  fee_tier?: number;
  min_deposit?: string;
  max_deposit?: string;
  time_lock_duration?: number;
  auto_compound?: boolean;
  environmental_metadata?: {
    asset_type: string;
    certification_standard: string;
    impact_multiplier: string;
    carbon_negative: boolean;
    retirement_percentage: string;
    sdg_alignment: Record<string, string>;
  };
}

export interface YieldImpactMetrics {
  carbon_offset_tons?: string;
  land_area_protected_hectares?: string;
  renewable_energy_mwh?: string;
  auto_retired_credits?: string;
}

export interface YieldImpactResults {
  strategy_id: string;
  strategy_name: string;
  investment_amount: string;
  duration_days: string;
  impact_metrics: YieldImpactMetrics;
  environmental_metadata?: YieldStrategy['environmental_metadata'];
}

export interface ApplyStrategyParams {
  strategy_id: string;
  asset_id: string;
  amount: string;
  duration_days?: string;
}

export interface ApplyStrategyResult {
  transaction_id: string;
  strategy_id: string;
  asset_id: string;
  amount: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  estimated_yield?: string;
  estimated_impact?: YieldImpactMetrics;
}

// Filter parameters
export interface YieldStrategyFilters {
  asset_class?: number[];
  risk_level?: string[];
  min_annual_yield?: number;
  max_fee?: number;
  environmental_only?: boolean;
  auto_compound_only?: boolean;
  asset_type?: string[];
  min_retirement_percentage?: number;
  carbon_negative_only?: boolean;
}

// Context interface
interface YieldStrategyContextState {
  strategies: YieldStrategy[];
  userStrategies: ApplyStrategyResult[];
  filteredStrategies: YieldStrategy[];
  selectedStrategy: YieldStrategy | null;
  impactResults: YieldImpactResults | null;
  filters: YieldStrategyFilters;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchStrategies: () => Promise<void>;
  fetchUserStrategies: () => Promise<void>;
  applyStrategy: (params: ApplyStrategyParams) => Promise<ApplyStrategyResult>;
  calculateImpact: (strategy_id: string, investment_amount: string, duration_days: string) => Promise<YieldImpactResults>;
  setFilters: (filters: YieldStrategyFilters) => void;
  resetFilters: () => void;
  setSelectedStrategy: (strategy: YieldStrategy | null) => void;
}

// Create context with default values
const YieldStrategyContext = createContext<YieldStrategyContextState | undefined>(undefined);

// Props interface
interface YieldStrategyProviderProps {
  children: ReactNode;
}

// Provider component
export const YieldStrategyProvider: React.FC<YieldStrategyProviderProps> = ({ children }) => {
  const [strategies, setStrategies] = useState<YieldStrategy[]>([]);
  const [userStrategies, setUserStrategies] = useState<ApplyStrategyResult[]>([]);
  const [filteredStrategies, setFilteredStrategies] = useState<YieldStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<YieldStrategy | null>(null);
  const [impactResults, setImpactResults] = useState<YieldImpactResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Default filters
  const [filters, setFiltersState] = useState<YieldStrategyFilters>({
    asset_class: undefined,
    risk_level: undefined,
    min_annual_yield: 0,
    max_fee: 100,
    environmental_only: false,
    auto_compound_only: false,
    asset_type: undefined,
    min_retirement_percentage: 0,
    carbon_negative_only: false
  });

  // Fetch strategies from API
  const fetchStrategies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would make a real API call with filters
      try {
        const response = await api.get<StrategiesResponse>('/yield/strategies');
        const data = response.data?.strategies || getMockStrategies();
        
        setStrategies(data);
        applyFilters(data, filters);
      } catch (apiError) {
        console.error('API error:', apiError);
        // Fallback to mock data
        const mockData = getMockStrategies();
        setStrategies(mockData);
        applyFilters(mockData, filters);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching yield strategies:', err);
      setError('Failed to load yield strategies');
      setLoading(false);
      
      // For demo purposes, set mock data if API fails
      const mockData = getMockStrategies();
      setStrategies(mockData);
      applyFilters(mockData, filters);
    }
  };

  // Fetch user's applied strategies
  const fetchUserStrategies = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would make a real API call
      try {
        const response = await api.get<UserStrategiesResponse>('/yield/strategies/user');
        const data = response.data?.strategies || getMockUserStrategies();
        
        setUserStrategies(data);
      } catch (apiError) {
        console.error('API error:', apiError);
        // Fallback to mock data
        setUserStrategies(getMockUserStrategies());
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user strategies:', err);
      setError('Failed to load your applied strategies');
      setLoading(false);
      
      // For demo purposes, set mock data if API fails
      setUserStrategies(getMockUserStrategies());
    }
  };

  // Apply a strategy to an asset
  const applyStrategy = async (params: ApplyStrategyParams): Promise<ApplyStrategyResult> => {
    try {
      setLoading(true);
      
      // In a real implementation, this would make a real API call
      let result: ApplyStrategyResult;
      
      try {
        const response = await api.post<ApplyStrategyResult>('/yield/strategies/apply', params);
        // Ensure the response is properly typed or use the mock result
        if (response.data && 'transaction_id' in response.data) {
          result = response.data;
        } else {
          result = getMockApplyResult(params);
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // Fallback to mock data
        result = getMockApplyResult(params);
      }
      
      // Update user strategies
      setUserStrategies(prev => [...prev, result]);
      
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Error applying strategy:', err);
      setError('Failed to apply strategy');
      setLoading(false);
      
      // For demo purposes, return mock data if API fails
      const mockResult = getMockApplyResult(params);
      setUserStrategies(prev => [...prev, mockResult]);
      return mockResult;
    }
  };

  // Calculate environmental impact of a strategy
  const calculateImpact = async (
    strategy_id: string,
    investment_amount: string,
    duration_days: string
  ): Promise<YieldImpactResults> => {
    try {
      setLoading(true);
      
      // Build request payload
      const payload = {
        strategy_id,
        investment_amount,
        duration_days,
      };
      
      // In a real implementation, this would make a real API call
      let result: YieldImpactResults;
      
      try {
        const response = await api.post<YieldImpactResults>('/yield/strategies/impact', payload);
        result = response.data || getMockImpactResults(strategy_id, investment_amount, duration_days);
      } catch (apiError) {
        console.error('API error:', apiError);
        // Fallback to mock data
        result = getMockImpactResults(strategy_id, investment_amount, duration_days);
      }
      
      setImpactResults(result);
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Error calculating impact:', err);
      setError('Failed to calculate impact');
      setLoading(false);
      
      // For demo purposes, return mock data if API fails
      const mockResult = getMockImpactResults(strategy_id, investment_amount, duration_days);
      setImpactResults(mockResult);
      return mockResult;
    }
  };

  // Update filters and apply them
  const setFilters = (newFilters: YieldStrategyFilters) => {
    setFiltersState(newFilters);
    applyFilters(strategies, newFilters);
  };

  // Reset filters to default
  const resetFilters = () => {
    const defaultFilters: YieldStrategyFilters = {
      asset_class: undefined,
      risk_level: undefined,
      min_annual_yield: 0,
      max_fee: 100,
      environmental_only: false,
      auto_compound_only: false,
      asset_type: undefined,
      min_retirement_percentage: 0,
      carbon_negative_only: false
    };
    
    setFiltersState(defaultFilters);
    applyFilters(strategies, defaultFilters);
  };

  // Apply filters to strategies
  const applyFilters = (allStrategies: YieldStrategy[], currentFilters: YieldStrategyFilters) => {
    let result = [...allStrategies];
    
    // Filter by asset class
    if (currentFilters.asset_class && currentFilters.asset_class.length > 0) {
      result = result.filter(strategy => 
        strategy.asset_class !== undefined && 
        currentFilters.asset_class?.includes(strategy.asset_class)
      );
    }
    
    // Filter by risk level
    if (currentFilters.risk_level && currentFilters.risk_level.length > 0) {
      result = result.filter(strategy => 
        currentFilters.risk_level?.includes(strategy.risk_level)
      );
    }
    
    // Filter by minimum annual yield
    if (currentFilters.min_annual_yield && currentFilters.min_annual_yield > 0) {
      result = result.filter(strategy => 
        strategy.annual_yield_percentage !== undefined && 
        parseFloat(strategy.annual_yield_percentage) >= (currentFilters.min_annual_yield || 0)
      );
    }
    
    // Filter by maximum fee
    if (currentFilters.max_fee && currentFilters.max_fee < 100) {
      result = result.filter(strategy => 
        parseFloat(strategy.performance_fee) / 100 <= (currentFilters.max_fee || 100)
      );
    }
    
    // Filter by environmental only
    if (currentFilters.environmental_only) {
      result = result.filter(strategy => 
        strategy.environmental_metadata !== undefined
      );
    }
    
    // Filter by auto compound only
    if (currentFilters.auto_compound_only) {
      result = result.filter(strategy => 
        strategy.auto_compound === true
      );
    }
    
    // Filter by environmental asset type
    if (currentFilters.asset_type && currentFilters.asset_type.length > 0 && currentFilters.environmental_only) {
      result = result.filter(strategy => 
        strategy.environmental_metadata !== undefined && 
        currentFilters.asset_type?.includes(strategy.environmental_metadata.asset_type)
      );
    }
    
    // Filter by minimum retirement percentage
    if (currentFilters.min_retirement_percentage && currentFilters.min_retirement_percentage > 0 && currentFilters.environmental_only) {
      result = result.filter(strategy => 
        strategy.environmental_metadata !== undefined && 
        parseInt(strategy.environmental_metadata.retirement_percentage) >= (currentFilters.min_retirement_percentage || 0)
      );
    }
    
    // Filter by carbon negative only
    if (currentFilters.carbon_negative_only && currentFilters.environmental_only) {
      result = result.filter(strategy => 
        strategy.environmental_metadata !== undefined && 
        strategy.environmental_metadata.carbon_negative === true
      );
    }
    
    setFilteredStrategies(result);
  };

  // Load initial data
  useEffect(() => {
    fetchStrategies();
  }, []);

  // Mock data functions
  const getMockStrategies = (): YieldStrategy[] => {
    return [
      {
        strategy_id: "0x0000000000000000000000000000000000000000000000000000000000000001",
        name: "Treasury Yield Maximizer",
        description: "Optimizes yield by dynamically allocating treasury tokens across various maturity dates.",
        risk_level: "CONSERVATIVE",
        is_public: true,
        is_active: true,
        creation_date: Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60, // 90 days ago
        performance_fee: "100", // 1.00%
        metadata_uri: "ipfs://Qm...",
        asset_class: 0, // Treasury
        annual_yield_percentage: "4.25",
        fee_tier: 30, // 0.3%
        min_deposit: "1000000000000000000", // 1.0 tokens
        auto_compound: true
      },
      {
        strategy_id: "0x0000000000000000000000000000000000000000000000000000000000000002",
        name: "Real Estate Income Strategy",
        description: "Generates yield through diversified allocation across tokenized real estate assets.",
        risk_level: "MODERATE",
        is_public: true,
        is_active: true,
        creation_date: Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60, // 60 days ago
        performance_fee: "200", // 2.00%
        metadata_uri: "ipfs://Qm...",
        asset_class: 1, // Real Estate
        annual_yield_percentage: "6.75",
        fee_tier: 50, // 0.5%
        min_deposit: "10000000000000000000", // 10.0 tokens
        auto_compound: true
      },
      {
        strategy_id: "0x0000000000000000000000000000000000000000000000000000000000000003",
        name: "Stablecoin Liquidity Yield",
        description: "Maximizes returns by providing liquidity to stablecoin pairs across multiple DEXes.",
        risk_level: "MODERATE",
        is_public: true,
        is_active: true,
        creation_date: Math.floor(Date.now() / 1000) - 45 * 24 * 60 * 60, // 45 days ago
        performance_fee: "150", // 1.50%
        metadata_uri: "ipfs://Qm...",
        asset_class: 3, // Stablecoin
        annual_yield_percentage: "5.60",
        fee_tier: 10, // 0.1%
        min_deposit: "1000000000", // 1.0 tokens (for stablecoins with 6 decimals)
        auto_compound: true
      },
      {
        strategy_id: "0x0000000000000000000000000000000000000000000000000000000000000004",
        name: "Commodity Hedged Yield",
        description: "Generates yield from commodity tokens while hedging against price volatility.",
        risk_level: "AGGRESSIVE",
        is_public: true,
        is_active: true,
        creation_date: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60, // 30 days ago
        performance_fee: "250", // 2.50%
        metadata_uri: "ipfs://Qm...",
        asset_class: 2, // Commodity
        annual_yield_percentage: "7.80",
        fee_tier: 100, // 1.0%
        min_deposit: "5000000000000000000", // 5.0 tokens
        auto_compound: false
      },
      {
        strategy_id: "0x0000000000000000000000000000000000000000000000000000000000000005",
        name: "Carbon Credits Yield Optimizer",
        description: "High-impact strategy that optimizes yield while automatically retiring a portion of carbon credits to maximize environmental impact.",
        risk_level: "MODERATE",
        is_public: true,
        is_active: true,
        creation_date: Math.floor(Date.now() / 1000) - 75 * 24 * 60 * 60, // 75 days ago
        performance_fee: "200", // 2.00%
        metadata_uri: "ipfs://Qm...",
        asset_class: 4, // Environmental
        annual_yield_percentage: "5.25",
        fee_tier: 50, // 0.5%
        min_deposit: "1000000000000000000", // 1.0 tokens
        auto_compound: true,
        environmental_metadata: {
          asset_type: "CarbonCredit",
          certification_standard: "Verra",
          impact_multiplier: "120",
          carbon_negative: true,
          retirement_percentage: "20",
          sdg_alignment: {
            "13": "90",
            "15": "80",
          }
        }
      },
      {
        strategy_id: "0x0000000000000000000000000000000000000000000000000000000000000006",
        name: "Biodiversity Protection Yield",
        description: "Strategy focused on biodiversity credits with automatic compounding and partial retirement to fund conservation projects.",
        risk_level: "CONSERVATIVE",
        is_public: true,
        is_active: true,
        creation_date: Math.floor(Date.now() / 1000) - 85 * 24 * 60 * 60, // 85 days ago
        performance_fee: "150", // 1.50%
        metadata_uri: "ipfs://Qm...",
        asset_class: 4, // Environmental
        annual_yield_percentage: "4.50",
        fee_tier: 30, // 0.3%
        min_deposit: "2000000000000000000", // 2.0 tokens
        auto_compound: true,
        environmental_metadata: {
          asset_type: "BiodiversityCredit",
          certification_standard: "Gold Standard",
          impact_multiplier: "130",
          carbon_negative: false,
          retirement_percentage: "15",
          sdg_alignment: {
            "14": "95",
            "15": "90",
          }
        }
      },
      {
        strategy_id: "0x0000000000000000000000000000000000000000000000000000000000000007",
        name: "Renewable Energy Certificate Optimizer",
        description: "Focuses on maximizing yield from renewable energy certificates while supporting new clean energy projects.",
        risk_level: "AGGRESSIVE",
        is_public: true,
        is_active: true,
        creation_date: Math.floor(Date.now() / 1000) - 40 * 24 * 60 * 60, // 40 days ago
        performance_fee: "300", // 3.00%
        metadata_uri: "ipfs://Qm...",
        asset_class: 4, // Environmental
        annual_yield_percentage: "7.25",
        fee_tier: 100, // 1.0%
        min_deposit: "3000000000000000000", // 3.0 tokens
        auto_compound: false,
        environmental_metadata: {
          asset_type: "RenewableEnergyCertificate",
          certification_standard: "I-REC",
          impact_multiplier: "110",
          carbon_negative: true,
          retirement_percentage: "10",
          sdg_alignment: {
            "7": "95",
            "9": "75",
            "13": "85",
          }
        }
      },
    ];
  };

  // Mock user strategies
  const getMockUserStrategies = (): ApplyStrategyResult[] => {
    return [
      {
        transaction_id: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        strategy_id: "0x0000000000000000000000000000000000000000000000000000000000000001",
        asset_id: "0xasset1",
        amount: "10000000000000000000", // 10.0 tokens
        status: "COMPLETED",
        estimated_yield: "425000000000000000", // 0.425 tokens (4.25%)
        estimated_impact: undefined
      },
      {
        transaction_id: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        strategy_id: "0x0000000000000000000000000000000000000000000000000000000000000005",
        asset_id: "0xasset5",
        amount: "5000000000000000000", // 5.0 tokens
        status: "COMPLETED",
        estimated_yield: "262500000000000000", // 0.2625 tokens (5.25%)
        estimated_impact: {
          carbon_offset_tons: "12",
          land_area_protected_hectares: "2",
          auto_retired_credits: "1" // 20% of yield
        }
      }
    ];
  };

  // Mock apply result
  const getMockApplyResult = (params: ApplyStrategyParams): ApplyStrategyResult => {
    const strategy = strategies.find(s => s.strategy_id === params.strategy_id);
    const amount = params.amount;
    
    let estimatedImpact: YieldImpactMetrics | undefined = undefined;
    
    if (strategy?.environmental_metadata) {
      estimatedImpact = {
        carbon_offset_tons: "10",
        land_area_protected_hectares: "1",
        renewable_energy_mwh: "25",
        auto_retired_credits: (parseInt(amount) * parseInt(strategy.environmental_metadata.retirement_percentage) / 100).toString()
      };
    }
    
    return {
      transaction_id: `0x${Math.random().toString(16).substring(2)}`,
      strategy_id: params.strategy_id,
      asset_id: params.asset_id,
      amount: params.amount,
      status: "PENDING",
      estimated_yield: strategy?.annual_yield_percentage 
        ? (parseInt(amount) * parseFloat(strategy.annual_yield_percentage) / 100).toString()
        : undefined,
      estimated_impact: estimatedImpact
    };
  };

  // Mock impact results
  const getMockImpactResults = (strategy_id: string, investment_amount: string, duration_days: string): YieldImpactResults => {
    const strategy = strategies.find(s => s.strategy_id === strategy_id);
    
    let impactMetrics: YieldImpactMetrics = {};
    
    if (strategy?.environmental_metadata) {
      // Calculate mock impact based on investment amount, duration and strategy parameters
      const amountNum = parseInt(investment_amount);
      const daysNum = parseInt(duration_days);
      const annualFactor = daysNum / 365;
      const impactMultiplier = parseInt(strategy.environmental_metadata.impact_multiplier) / 100;
      
      // Mock calculations
      const carbonOffset = Math.floor(amountNum * 0.001 * annualFactor * impactMultiplier).toString();
      const landArea = Math.floor(amountNum * 0.0002 * annualFactor * impactMultiplier).toString();
      const renewableEnergy = Math.floor(amountNum * 0.005 * annualFactor * impactMultiplier).toString();
      const autoRetiredCredits = Math.floor(amountNum * parseInt(strategy.environmental_metadata.retirement_percentage) / 100 * annualFactor).toString();
      
      impactMetrics = {
        carbon_offset_tons: carbonOffset,
        land_area_protected_hectares: landArea,
        renewable_energy_mwh: renewableEnergy,
        auto_retired_credits: autoRetiredCredits
      };
    }
    
    return {
      strategy_id,
      strategy_name: strategy?.name || "Unknown Strategy",
      investment_amount,
      duration_days,
      impact_metrics: impactMetrics,
      environmental_metadata: strategy?.environmental_metadata
    };
  };

  return (
    <YieldStrategyContext.Provider
      value={{
        strategies,
        userStrategies,
        filteredStrategies,
        selectedStrategy,
        impactResults,
        filters,
        loading,
        error,
        
        fetchStrategies,
        fetchUserStrategies,
        applyStrategy,
        calculateImpact,
        setFilters,
        resetFilters,
        setSelectedStrategy
      }}
    >
      {children}
    </YieldStrategyContext.Provider>
  );
};

// Custom hook to use the context
export const useYieldStrategy = () => {
  const context = useContext(YieldStrategyContext);
  if (context === undefined) {
    throw new Error('useYieldStrategy must be used within a YieldStrategyProvider');
  }
  return context;
};

export default YieldStrategyContext; 