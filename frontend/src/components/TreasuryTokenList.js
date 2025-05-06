import React, { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup, Dropdown, DropdownButton, Card, Badge, Spinner } from 'react-bootstrap';

// Mock data for development - will be replaced with API calls
const mockTreasuryTokens = [
  {
    tokenId: '0x123',
    name: '10-Year Treasury Note',
    symbol: 'TNOTE-10Y',
    treasuryType: 'TNOTE',
    currentPrice: '980.25',
    yieldRate: 3.5,
    maturityDate: new Date('2033-01-15').getTime() / 1000,
    status: 'ACTIVE',
  },
  {
    tokenId: '0x456',
    name: '3-Month Treasury Bill',
    symbol: 'TBILL-3M',
    treasuryType: 'TBILL',
    currentPrice: '995.50',
    yieldRate: 2.1,
    maturityDate: new Date('2023-08-30').getTime() / 1000,
    status: 'MATURED',
  },
  {
    tokenId: '0x789',
    name: '30-Year Treasury Bond',
    symbol: 'TBOND-30Y',
    treasuryType: 'TBOND',
    currentPrice: '950.75',
    yieldRate: 4.2,
    maturityDate: new Date('2053-06-15').getTime() / 1000,
    status: 'ACTIVE',
  },
];

const TreasuryTokenList = () => {
  const [tokens, setTokens] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    search: '',
    type: 'ALL',
    status: 'ALL',
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'ascending',
  });

  // Fetch tokens from API
  useEffect(() => {
    // Simulating API call with mock data
    const fetchTokens = async () => {
      try {
        setLoading(true);
        // In a real application, this would be an API call
        // const response = await api.getTreasuryTokens();
        // setTokens(response.data);
        
        // Using mock data for now
        setTokens(mockTreasuryTokens);
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch treasury tokens');
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...tokens];

    // Apply search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(
        token =>
          token.name.toLowerCase().includes(searchLower) ||
          token.symbol.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (filter.type !== 'ALL') {
      result = result.filter(token => token.treasuryType === filter.type);
    }

    // Apply status filter
    if (filter.status !== 'ALL') {
      result = result.filter(token => token.status === filter.status);
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredTokens(result);
  }, [tokens, filter, sortConfig]);

  // Request sort
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Format date
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Format status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge bg="success">Active</Badge>;
      case 'MATURED':
        return <Badge bg="warning">Matured</Badge>;
      case 'REDEEMED':
        return <Badge bg="secondary">Redeemed</Badge>;
      default:
        return <Badge bg="light">Unknown</Badge>;
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setFilter({ ...filter, search: e.target.value });
  };

  // Handle type filter
  const handleTypeFilter = (type) => {
    setFilter({ ...filter, type });
  };

  // Handle status filter
  const handleStatusFilter = (status) => {
    setFilter({ ...filter, status });
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mt-3" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="treasury-token-list mt-4">
      <Card>
        <Card.Header>
          <h4>Treasury Tokens</h4>
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-between mb-3">
            <InputGroup className="w-50">
              <Form.Control
                placeholder="Search by name or symbol"
                value={filter.search}
                onChange={handleSearch}
              />
            </InputGroup>
            
            <div className="d-flex">
              <DropdownButton 
                id="type-filter" 
                title={`Type: ${filter.type}`} 
                variant="outline-secondary"
                className="me-2"
              >
                <Dropdown.Item onClick={() => handleTypeFilter('ALL')}>ALL</Dropdown.Item>
                <Dropdown.Item onClick={() => handleTypeFilter('TBILL')}>T-Bill</Dropdown.Item>
                <Dropdown.Item onClick={() => handleTypeFilter('TNOTE')}>T-Note</Dropdown.Item>
                <Dropdown.Item onClick={() => handleTypeFilter('TBOND')}>T-Bond</Dropdown.Item>
              </DropdownButton>
              
              <DropdownButton 
                id="status-filter" 
                title={`Status: ${filter.status}`} 
                variant="outline-secondary"
              >
                <Dropdown.Item onClick={() => handleStatusFilter('ALL')}>ALL</Dropdown.Item>
                <Dropdown.Item onClick={() => handleStatusFilter('ACTIVE')}>Active</Dropdown.Item>
                <Dropdown.Item onClick={() => handleStatusFilter('MATURED')}>Matured</Dropdown.Item>
                <Dropdown.Item onClick={() => handleStatusFilter('REDEEMED')}>Redeemed</Dropdown.Item>
              </DropdownButton>
            </div>
          </div>

          {filteredTokens.length === 0 ? (
            <div className="alert alert-info">No treasury tokens found matching the criteria.</div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th onClick={() => requestSort('name')}>
                    Name {getSortIcon('name')}
                  </th>
                  <th onClick={() => requestSort('symbol')}>
                    Symbol {getSortIcon('symbol')}
                  </th>
                  <th onClick={() => requestSort('treasuryType')}>
                    Type {getSortIcon('treasuryType')}
                  </th>
                  <th onClick={() => requestSort('currentPrice')}>
                    Price (USD) {getSortIcon('currentPrice')}
                  </th>
                  <th onClick={() => requestSort('yieldRate')}>
                    Yield (%) {getSortIcon('yieldRate')}
                  </th>
                  <th onClick={() => requestSort('maturityDate')}>
                    Maturity Date {getSortIcon('maturityDate')}
                  </th>
                  <th onClick={() => requestSort('status')}>
                    Status {getSortIcon('status')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTokens.map((token) => (
                  <tr key={token.tokenId}>
                    <td>{token.name}</td>
                    <td>{token.symbol}</td>
                    <td>{token.treasuryType}</td>
                    <td>${parseFloat(token.currentPrice).toFixed(2)}</td>
                    <td>{token.yieldRate.toFixed(2)}%</td>
                    <td>{formatDate(token.maturityDate)}</td>
                    <td>{getStatusBadge(token.status)}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        href={`/treasury/${token.tokenId}`}
                      >
                        View
                      </Button>
                      {token.status === 'ACTIVE' && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="ms-2"
                          href={`/trade/${token.tokenId}`}
                        >
                          Trade
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default TreasuryTokenList; 