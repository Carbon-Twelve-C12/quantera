import React, { useState, useEffect } from 'react';
import { treasuryService } from '../api/treasuryService';
import { TreasuryOverview, TreasuriesGetTreasuryTypeEnum } from '../api/generated';

interface TreasuryListProps {
  initialLimit?: number;
}

const TreasuryList: React.FC<TreasuryListProps> = ({ initialLimit = 10 }) => {
  const [treasuries, setTreasuries] = useState<TreasuryOverview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter/pagination state
  const [treasuryType, setTreasuryType] = useState<TreasuriesGetTreasuryTypeEnum | undefined>(undefined);
  const [minYield, setMinYield] = useState<number | undefined>(undefined);
  const [maxMaturity, setMaxMaturity] = useState<number | undefined>(undefined);
  const [limit, setLimit] = useState<number>(initialLimit);
  const [offset, setOffset] = useState<number>(0);

  // Load treasuries
  const loadTreasuries = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await treasuryService.listTreasuries(
        treasuryType,
        minYield,
        maxMaturity,
        limit,
        offset
      );
      setTreasuries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load treasuries');
    } finally {
      setLoading(false);
    }
  };

  // Load on initial render and when filters change
  useEffect(() => {
    loadTreasuries();
  }, [treasuryType, minYield, maxMaturity, limit, offset]);

  // Handle type filter change
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setTreasuryType(value === 'all' ? undefined : value as TreasuriesGetTreasuryTypeEnum);
    setOffset(0); // Reset pagination when filter changes
  };

  // Handle min yield change
  const handleMinYieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
    setMinYield(value);
    setOffset(0); // Reset pagination when filter changes
  };

  // Handle pagination
  const handleNextPage = () => {
    setOffset(offset + limit);
  };

  const handlePrevPage = () => {
    setOffset(Math.max(0, offset - limit));
  };

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="treasury-list">
      <h2>Treasury Securities</h2>
      
      {/* Filter controls */}
      <div className="filters">
        <div className="filter-item">
          <label htmlFor="type-filter">Type:</label>
          <select 
            id="type-filter"
            value={treasuryType || 'all'}
            onChange={handleTypeChange}
          >
            <option value="all">All Types</option>
            <option value="tbill">T-Bill</option>
            <option value="tnote">T-Note</option>
            <option value="tbond">T-Bond</option>
          </select>
        </div>
        
        <div className="filter-item">
          <label htmlFor="yield-filter">Min Yield (basis points):</label>
          <input 
            id="yield-filter"
            type="number"
            min="0"
            value={minYield || ''}
            onChange={handleMinYieldChange}
            placeholder="Min Yield"
          />
        </div>
        
        <button onClick={loadTreasuries}>Refresh</button>
      </div>
      
      {/* Error message */}
      {error && <div className="error-message">{error}</div>}
      
      {/* Loading state */}
      {loading ? (
        <div className="loading">Loading treasuries...</div>
      ) : (
        <>
          {/* Treasuries table */}
          {treasuries.length > 0 ? (
            <table className="treasuries-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Yield Rate</th>
                  <th>Maturity Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {treasuries.map((treasury) => (
                  <tr key={treasury.token_id}>
                    <td>{treasury.name}</td>
                    <td>{treasury.symbol}</td>
                    <td>{treasury.treasury_type}</td>
                    <td>{treasury.current_price}</td>
                    <td>{treasury.yield_rate ? `${treasury.yield_rate / 100}%` : 'N/A'}</td>
                    <td>{treasury.maturity_date ? formatDate(treasury.maturity_date) : 'N/A'}</td>
                    <td>{treasury.status}</td>
                    <td>
                      <a href={`/treasuries/${treasury.token_id}`}>View Details</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-data">No treasuries found</div>
          )}
          
          {/* Pagination controls */}
          <div className="pagination">
            <button 
              onClick={handlePrevPage} 
              disabled={offset === 0}
            >
              Previous
            </button>
            <span>Page {Math.floor(offset / limit) + 1}</span>
            <button 
              onClick={handleNextPage}
              disabled={treasuries.length < limit}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TreasuryList; 