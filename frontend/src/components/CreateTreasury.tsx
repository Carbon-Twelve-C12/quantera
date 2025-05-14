import React, { useState } from 'react';
import { treasuryService } from '../api/treasuryService';
import { CreateTreasuryRequest, CreateTreasuryRequestTreasuryTypeEnum } from '../api/generated';

const CreateTreasury: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState<Partial<CreateTreasuryRequest>>({
    name: '',
    symbol: '',
    description: '',
    treasury_type: CreateTreasuryRequestTreasuryTypeEnum.Tbill,
    total_supply: '',
    face_value: '',
    yield_rate: 0,
    maturity_date: 0,
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complianceError, setComplianceError] = useState<string | null>(null);

  // Fee calculation state
  const [feeAmount, setFeeAmount] = useState<string>('0');
  const [feeTier, setFeeTier] = useState<string>('standard'); // 'standard', 'premium', 'enterprise'

  // Platform fee tiers
  const feeTiers = {
    standard: { rate: 0.02, label: 'Standard (2%)', minFee: 500 },
    premium: { rate: 0.015, label: 'Premium (1.5%)', minFee: 1000 },
    enterprise: { rate: 0.01, label: 'Enterprise (1%)', minFee: 2500 },
  };

  // Input change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'yield_rate') {
      setFormData({ ...formData, [name]: parseInt(value, 10) || 0 });
    } else if (name === 'maturity_date') {
      // Convert date string to Unix timestamp
      if (value) {
        const date = new Date(value);
        const timestamp = Math.floor(date.getTime() / 1000);
        setFormData({ ...formData, [name]: timestamp });
      } else {
        setFormData({ ...formData, [name]: 0 });
      }
    } else if (name === 'feeTier') {
      setFeeTier(value);
      // Recalculate fee when tier changes
      calculateFee(formData.face_value || '', formData.total_supply || '', value);
    } else {
      setFormData({ ...formData, [name]: value });

      // Recalculate fee when value changes if it's relevant to fee calculation
      if (name === 'face_value' || name === 'total_supply') {
        calculateFee(
          name === 'face_value' ? value : formData.face_value || '',
          name === 'total_supply' ? value : formData.total_supply || '',
          feeTier
        );
      }
    }
  };

  // Calculate platform fee
  const calculateFee = (faceValue: string, totalSupply: string, tier: string) => {
    const selectedTier = feeTiers[tier as keyof typeof feeTiers];
    
    if (!faceValue || !totalSupply) {
      setFeeAmount('0');
      return;
    }
    
    try {
      // Calculate total asset value
      const value = parseFloat(faceValue) * parseFloat(totalSupply);
      
      // Calculate fee based on tier rate
      let calculatedFee = value * selectedTier.rate;
      
      // Apply minimum fee
      if (calculatedFee < selectedTier.minFee) {
        calculatedFee = selectedTier.minFee;
      }
      
      setFeeAmount(calculatedFee.toFixed(2));
    } catch (err) {
      setFeeAmount('0');
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset status
    setLoading(true);
    setSuccess(false);
    setError(null);
    setComplianceError(null);
    
    // Basic validation
    if (!formData.name || !formData.symbol || !formData.description || 
        !formData.total_supply || !formData.face_value || 
        !formData.yield_rate || !formData.maturity_date) {
      setError('Please fill out all required fields');
      setLoading(false);
      return;
    }
    
    try {
      // Include the platform fee in the submission data
      const submissionData = {
        ...formData as CreateTreasuryRequest,
        platform_fee: {
          amount: feeAmount,
          tier: feeTier
        }
      };
      
      // Submit the form
      await treasuryService.createTreasury(submissionData as CreateTreasuryRequest);
      setSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        symbol: '',
        description: '',
        treasury_type: CreateTreasuryRequestTreasuryTypeEnum.Tbill,
        total_supply: '',
        face_value: '',
        yield_rate: 0,
        maturity_date: 0,
      });
      setFeeAmount('0');
      setFeeTier('standard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Check if this is a compliance error
      if (errorMessage.includes('compliance') || errorMessage.includes('Unauthorized')) {
        setComplianceError(errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Convert Unix timestamp to date string for input
  const timestampToDateString = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="create-treasury">
      <h2>Create New Treasury</h2>
      
      {/* Success message */}
      {success && (
        <div className="success-message">
          Treasury created successfully!
        </div>
      )}
      
      {/* Error messages */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {/* Compliance error message with more details */}
      {complianceError && (
        <div className="compliance-error">
          <h3>Compliance Check Failed</h3>
          <p>{complianceError}</p>
          <p>Please ensure you meet all regulatory requirements before creating a treasury.</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Treasury Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="symbol">Symbol</label>
          <input
            type="text"
            id="symbol"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            required
            maxLength={10}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="treasury_type">Treasury Type</label>
          <select
            id="treasury_type"
            name="treasury_type"
            value={formData.treasury_type}
            onChange={handleChange}
            required
          >
            <option value={CreateTreasuryRequestTreasuryTypeEnum.Tbill}>T-Bill</option>
            <option value={CreateTreasuryRequestTreasuryTypeEnum.Tnote}>T-Note</option>
            <option value={CreateTreasuryRequestTreasuryTypeEnum.Tbond}>T-Bond</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="total_supply">Total Supply</label>
          <input
            type="text"
            id="total_supply"
            name="total_supply"
            value={formData.total_supply}
            onChange={handleChange}
            required
            placeholder="e.g. 1000000"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="face_value">Face Value</label>
          <input
            type="text"
            id="face_value"
            name="face_value"
            value={formData.face_value}
            onChange={handleChange}
            required
            placeholder="e.g. 1000.00"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="yield_rate">Yield Rate (basis points)</label>
          <input
            type="number"
            id="yield_rate"
            name="yield_rate"
            value={formData.yield_rate || ''}
            onChange={handleChange}
            required
            min="0"
            max="10000"
            placeholder="e.g. 305 for 3.05%"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="maturity_date_input">Maturity Date</label>
          <input
            type="date"
            id="maturity_date_input"
            name="maturity_date"
            value={timestampToDateString(formData.maturity_date || 0)}
            onChange={handleChange}
            required
          />
        </div>
        
        {/* Platform Fee Section */}
        <div className="platform-fee-section">
          <h3>Platform Fee</h3>
          <p className="fee-explanation">
            Quantera charges a one-time fee for creating and deploying new treasury assets on the platform.
            The fee varies based on the selected tier and total asset value.
          </p>
          
          <div className="form-group">
            <label htmlFor="feeTier">Fee Tier</label>
            <select
              id="feeTier"
              name="feeTier"
              value={feeTier}
              onChange={handleChange}
            >
              <option value="standard">{feeTiers.standard.label}</option>
              <option value="premium">{feeTiers.premium.label}</option>
              <option value="enterprise">{feeTiers.enterprise.label}</option>
            </select>
            <small className="tier-detail">
              {feeTier === 'standard' && 'Recommended for assets under $1M. Minimum fee: $500'}
              {feeTier === 'premium' && 'Recommended for assets from $1M-$10M. Minimum fee: $1,000'}
              {feeTier === 'enterprise' && 'Recommended for assets over $10M. Minimum fee: $2,500'}
            </small>
          </div>
          
          <div className="fee-summary">
            <div className="fee-calculation">
              <p>
                <strong>Total Asset Value:</strong> ${formData.face_value && formData.total_supply ? 
                  (parseFloat(formData.face_value) * parseFloat(formData.total_supply)).toLocaleString() : '0'}
              </p>
              <p>
                <strong>Calculated Fee:</strong> ${feeAmount} ({feeTiers[feeTier as keyof typeof feeTiers].rate * 100}% of total value)
              </p>
              <p className="fee-note">
                This fee covers platform services including asset tokenization, compliance verification, and marketplace listing.
              </p>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Treasury'}
          </button>
        </div>
      </form>
      
      {/* Compliance note */}
      <div className="compliance-note">
        <h4>Compliance Note</h4>
        <p>
          Creating a treasury requires compliance with all applicable regulations.
          Your treasury creation will be reviewed for KYC/AML compliance before approval.
        </p>
      </div>
    </div>
  );
};

export default CreateTreasury; 