import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { treasuryService } from '../api/treasuryService';
import { TreasuryOverview, TreasuriesIdYieldGet200Response } from '../api/generated';

type ParamTypes = {
  id: string;
};

const TreasuryDetail: React.FC = () => {
  const { id } = useParams<ParamTypes>();
  
  const [treasury, setTreasury] = useState<TreasuryOverview | null>(null);
  const [yieldInfo, setYieldInfo] = useState<TreasuriesIdYieldGet200Response | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTreasuryData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch both treasury details and yield info in parallel
        const [treasuryData, yieldData] = await Promise.all([
          treasuryService.getTreasuryDetails(id),
          treasuryService.getTreasuryYield(id)
        ]);
        
        setTreasury(treasuryData);
        setYieldInfo(yieldData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load treasury data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTreasuryData();
  }, [id]);

  // Format date from timestamp
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };
  
  // Format time duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    
    const days = Math.floor(seconds / 86400);
    const remainingHours = Math.floor((seconds % 86400) / 3600);
    
    if (days > 365) {
      const years = (days / 365).toFixed(1);
      return `${years} years`;
    }
    
    if (days > 0) {
      return `${days} days, ${remainingHours} hours`;
    }
    
    return 'Less than a day';
  };

  if (loading) {
    return <div className="loading">Loading treasury data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!treasury) {
    return <div className="not-found">Treasury not found</div>;
  }

  return (
    <div className="treasury-detail">
      <h2>{treasury.name} ({treasury.symbol})</h2>
      
      <div className="main-details">
        <div className="detail-card status">
          <h3>Status</h3>
          <div className={`status-badge ${treasury.status?.toLowerCase()}`}>
            {treasury.status}
          </div>
        </div>
        
        <div className="detail-card price">
          <h3>Current Price</h3>
          <div className="price-value">{treasury.current_price}</div>
        </div>
        
        <div className="detail-card yield">
          <h3>Yield</h3>
          <div className="yield-value">
            {treasury.yield_rate ? (treasury.yield_rate / 100).toFixed(2) : 0}%
          </div>
          {yieldInfo?.annual_yield_percentage && (
            <div className="annual-yield">
              Annual: {yieldInfo.annual_yield_percentage.toFixed(2)}%
            </div>
          )}
        </div>
      </div>
      
      <div className="detail-sections">
        <div className="detail-section">
          <h3>Treasury Information</h3>
          <table className="detail-table">
            <tbody>
              <tr>
                <th>ID</th>
                <td>{treasury.token_id}</td>
              </tr>
              <tr>
                <th>Token Address</th>
                <td>
                  <code className="address">{treasury.token_address}</code>
                </td>
              </tr>
              <tr>
                <th>Type</th>
                <td>{treasury.treasury_type}</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>{treasury.status}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="detail-section">
          <h3>Important Dates</h3>
          <table className="detail-table">
            <tbody>
              <tr>
                <th>Issuance Date</th>
                <td>{formatDate(yieldInfo?.issuance_date)}</td>
              </tr>
              <tr>
                <th>Maturity Date</th>
                <td>{formatDate(treasury.maturity_date)}</td>
              </tr>
              <tr>
                <th>Time to Maturity</th>
                <td>{formatDuration(yieldInfo?.time_to_maturity)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="detail-section">
          <h3>Yield Information</h3>
          <table className="detail-table">
            <tbody>
              <tr>
                <th>Yield Rate (basis points)</th>
                <td>{treasury.yield_rate}</td>
              </tr>
              <tr>
                <th>Annual Yield</th>
                <td>
                  {yieldInfo?.annual_yield_percentage 
                    ? `${yieldInfo.annual_yield_percentage.toFixed(2)}%` 
                    : 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="action-buttons">
        <button className="secondary-button">Back to List</button>
        {treasury.status === 'Active' && (
          <button className="primary-button">Trade</button>
        )}
      </div>
    </div>
  );
};

export default TreasuryDetail; 