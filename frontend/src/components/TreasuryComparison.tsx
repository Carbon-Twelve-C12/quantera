import React, { useState, useEffect } from 'react';
import { treasuryService } from '../api/treasuryService';
import { TreasuryOverview } from '../api/generated';

const TreasuryComparison: React.FC = () => {
  const [treasuries, setTreasuries] = useState<TreasuryOverview[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTreasuries, setSelectedTreasuries] = useState<TreasuryOverview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load all treasuries
  useEffect(() => {
    const fetchTreasuries = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await treasuryService.listTreasuries();
        setTreasuries(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load treasuries');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTreasuries();
  }, []);

  // Update selected treasuries when selection changes
  useEffect(() => {
    const selected = treasuries.filter(t => t.token_id && selectedIds.includes(t.token_id));
    setSelectedTreasuries(selected);
  }, [selectedIds, treasuries]);

  // Handle treasury selection/deselection
  const toggleTreasury = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      if (selectedIds.length < 4) { // Limit to 4 for comparison
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  // Format date from timestamp
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Format yield rate
  const formatYield = (yieldRate?: number) => {
    if (!yieldRate && yieldRate !== 0) return 'N/A';
    return `${(yieldRate / 100).toFixed(2)}%`;
  };

  // Calculate time to maturity in days
  const daysToMaturity = (maturityDate?: number) => {
    if (!maturityDate) return 'N/A';
    const now = Math.floor(Date.now() / 1000);
    const secondsToMaturity = maturityDate - now;
    if (secondsToMaturity <= 0) return 'Matured';
    return Math.ceil(secondsToMaturity / 86400); // Convert seconds to days
  };

  // Generate bar chart data points as percentages for easy visualization
  const getChartData = () => {
    if (selectedTreasuries.length === 0) return [];
    
    // Find max values to normalize
    const maxYield = Math.max(...selectedTreasuries.map(t => t.yield_rate || 0));
    const maxPrice = Math.max(...selectedTreasuries.map(t => parseFloat(t.current_price || '0')));
    const maxMaturity = Math.max(...selectedTreasuries.map(t => {
      const days = t.maturity_date ? Math.max(0, t.maturity_date - Math.floor(Date.now() / 1000)) / 86400 : 0;
      return days;
    }));
    
    return selectedTreasuries.map(treasury => ({
      id: treasury.token_id,
      name: treasury.name,
      yieldPercentage: maxYield > 0 ? ((treasury.yield_rate || 0) / maxYield) * 100 : 0,
      pricePercentage: maxPrice > 0 ? (parseFloat(treasury.current_price || '0') / maxPrice) * 100 : 0,
      daysPercentage: maxMaturity > 0 ? ((treasury.maturity_date ? Math.max(0, treasury.maturity_date - Math.floor(Date.now() / 1000)) / 86400 : 0) / maxMaturity) * 100 : 0,
    }));
  };

  // Generate color based on index
  const getColor = (index: number) => {
    const colors = ['#2563eb', '#059669', '#d97706', '#dc2626'];
    return colors[index % colors.length];
  };

  if (loading) {
    return <div className="loading">Loading treasuries...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="treasury-comparison">
      <h2>Treasury Comparison</h2>
      
      <div className="comparison-instructions">
        <p>Select up to 4 treasuries to compare their key metrics side by side.</p>
      </div>
      
      {/* Treasury selection */}
      <div className="treasury-selection">
        <h3>Available Treasuries</h3>
        <div className="selection-grid">
          {treasuries.filter(treasury => treasury.token_id).map(treasury => (
            <div 
              key={treasury.token_id}
              className={`selection-card ${treasury.token_id && selectedIds.includes(treasury.token_id) ? 'selected' : ''}`}
              onClick={() => treasury.token_id && toggleTreasury(treasury.token_id)}
            >
              <div className="card-header">
                <h4>{treasury.name}</h4>
                <span className="symbol">{treasury.symbol}</span>
              </div>
              <div className="card-content">
                <div>Type: {treasury.treasury_type}</div>
                <div>Yield: {formatYield(treasury.yield_rate)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Comparison table */}
      {selectedTreasuries.length > 0 && (
        <div className="comparison-table-wrapper">
          <h3>Comparison</h3>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Metric</th>
                {selectedTreasuries.map((treasury, index) => (
                  <th key={treasury.token_id} style={{ color: getColor(index) }}>
                    {treasury.name} ({treasury.symbol})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Type</td>
                {selectedTreasuries.map(treasury => (
                  <td key={treasury.token_id}>{treasury.treasury_type}</td>
                ))}
              </tr>
              <tr>
                <td>Current Price</td>
                {selectedTreasuries.map(treasury => (
                  <td key={treasury.token_id}>{treasury.current_price || 'N/A'}</td>
                ))}
              </tr>
              <tr>
                <td>Yield Rate</td>
                {selectedTreasuries.map(treasury => (
                  <td key={treasury.token_id}>{formatYield(treasury.yield_rate)}</td>
                ))}
              </tr>
              <tr>
                <td>Maturity Date</td>
                {selectedTreasuries.map(treasury => (
                  <td key={treasury.token_id}>{formatDate(treasury.maturity_date)}</td>
                ))}
              </tr>
              <tr>
                <td>Days to Maturity</td>
                {selectedTreasuries.map(treasury => (
                  <td key={treasury.token_id}>{daysToMaturity(treasury.maturity_date)}</td>
                ))}
              </tr>
              <tr>
                <td>Status</td>
                {selectedTreasuries.map(treasury => (
                  <td key={treasury.token_id}>{treasury.status}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      
      {/* Visual comparison */}
      {selectedTreasuries.length > 0 && (
        <div className="visual-comparison">
          <h3>Visual Comparison</h3>
          
          <div className="chart-container">
            <div className="chart-label">Yield Rate</div>
            <div className="bar-chart">
              {getChartData().map((data, index) => (
                <div key={data.id} className="chart-row">
                  <div className="chart-label" style={{ color: getColor(index) }}>{data.name}</div>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        width: `${data.yieldPercentage}%`, 
                        backgroundColor: getColor(index)
                      }}
                    />
                    <span className="chart-value">{formatYield(selectedTreasuries[index].yield_rate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="chart-container">
            <div className="chart-label">Days to Maturity</div>
            <div className="bar-chart">
              {getChartData().map((data, index) => (
                <div key={data.id} className="chart-row">
                  <div className="chart-label" style={{ color: getColor(index) }}>{data.name}</div>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        width: `${data.daysPercentage}%`, 
                        backgroundColor: getColor(index)
                      }}
                    />
                    <span className="chart-value">{daysToMaturity(selectedTreasuries[index].maturity_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="chart-container">
            <div className="chart-label">Current Price</div>
            <div className="bar-chart">
              {getChartData().map((data, index) => (
                <div key={data.id} className="chart-row">
                  <div className="chart-label" style={{ color: getColor(index) }}>{data.name}</div>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        width: `${data.pricePercentage}%`, 
                        backgroundColor: getColor(index)
                      }}
                    />
                    <span className="chart-value">{selectedTreasuries[index].current_price || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {selectedTreasuries.length === 0 && (
        <div className="no-selection">
          <p>Select at least one treasury to see comparison data</p>
        </div>
      )}
    </div>
  );
};

export default TreasuryComparison; 