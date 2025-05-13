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
    } else {
      setFormData({ ...formData, [name]: value });
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
      // Submit the form
      await treasuryService.createTreasury(formData as CreateTreasuryRequest);
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