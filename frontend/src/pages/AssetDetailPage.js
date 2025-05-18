import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { treasuries } from '../data/mockTreasuriesData';
import { environmentalAssets } from '../data/mockEnvironmentalAssetsData';
import ImageWithFallback from '../components/common/ImageWithFallback';

// Asset detail component with improved styling
const AssetDetailPage = () => {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    console.log(`Looking for asset with ID: ${id}`);
    console.log(`Available treasury IDs:`, treasuries.map(t => t.token_id));
    console.log(`Available environmental asset IDs:`, environmentalAssets.map(e => e.asset_id));

    // Look in treasury data first
    const treasuryAsset = treasuries.find(t => t.token_id === id);
    if (treasuryAsset) {
      setAsset(treasuryAsset);
      setLoading(false);
      return;
    }

    // Then look in environmental assets - check both asset_id and token_id
    const environmentalAsset = environmentalAssets.find(
      e => e.asset_id === id || (e.security_details && e.security_details.token_id === id)
    );
    if (environmentalAsset) {
      setAsset(environmentalAsset);
      setLoading(false);
      return;
    }

    // If not found
    setNotFound(true);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading asset details...</p>
      </Container>
    );
  }

  if (notFound || !asset) {
    return (
      <Container className="py-5">
        <Card className="text-center border-0 shadow-sm">
          <Card.Body className="p-5">
            <h2>Asset Not Found</h2>
            <p className="text-muted mb-4">We couldn't find the asset you're looking for. It may have been removed or the URL is incorrect.</p>
            <Button as={Link} to="/marketplace" variant="primary">Return to Marketplace</Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Check if this is a treasury asset
  const isTreasury = (asset) => {
    if (!asset) return false;
    return asset.treasury_type !== undefined && 
           ['tbill', 'tnote', 'tbond', 'moneymarket'].includes(asset.treasury_type);
  };

  // Check if this is an environmental asset
  const isEnvironmental = (asset) => {
    if (!asset) return false;
    return asset.asset_type !== undefined && 
           ['CarbonCredit', 'BiodiversityCredit', 'WaterCredit', 'RenewableEnergyCertificate'].includes(asset.asset_type);
  };

  // Format date if available
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Helper function to get the correct image for environmental assets
  const getEnvironmentalAssetImage = (asset) => {
    // First try to use the image_url if it exists
    if (asset.image_url) {
      return asset.image_url;
    }

    // Direct mapping for known environmental assets
    switch(asset.asset_id) {
      case "0x5f0f0e0d0c0b0a09080706050403020100000005":
        return "/images/treasuries/amazon-rainforest.jpg";
      case "0x5f0f0e0d0c0b0a09080706050403020100000006":
        return "/images/treasuries/mangrove-restoration.jpg";
      case "0x5f0f0e0d0c0b0a09080706050403020100000007":
        return "/images/treasuries/highland-watershed.jpg";
      case "0x5f0f0e0d0c0b0a09080706050403020100000008":
        return "/images/treasuries/morocco-solar.jpg";
      default:
        // Fallback based on asset type if id matching fails
        if (asset.asset_type === "CarbonCredit") {
          return "/images/treasuries/amazon-rainforest.jpg";
        } else if (asset.asset_type === "BiodiversityCredit") {
          return "/images/treasuries/mangrove-restoration.jpg";
        } else if (asset.asset_type === "WaterCredit") {
          return "/images/treasuries/highland-watershed.jpg";
        } else if (asset.asset_type === "RenewableEnergyCertificate") {
          return "/images/treasuries/morocco-solar.jpg";
        }
        return "/images/asset-placeholder.jpg";
    }
  };

  return (
    <Container className="py-5">
      {/* Header section */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center mb-4">
            <Link to="/marketplace" className="text-decoration-none me-2">
              <i className="bi bi-arrow-left"></i> Back to Marketplace
            </Link>
          </div>
          <h1 className="display-5 fw-bold mb-1">
            {isTreasury(asset) ? asset.name : asset.project_name}
          </h1>
          <div className="d-flex align-items-center mb-3">
            <Badge bg={isTreasury(asset) ? 'primary' : 'success'} className="me-2">
              {isTreasury(asset) 
                ? asset.treasury_type.toUpperCase()
                : asset.asset_type}
            </Badge>
            {isTreasury(asset) && (
              <span className="text-muted">{asset.symbol}</span>
            )}
            {isEnvironmental(asset) && (
              <span className="text-muted">{asset.project_location}</span>
            )}
          </div>
        </Col>
      </Row>

      {/* Main content */}
      <Row className="g-4">
        {/* Left column - Image and key details */}
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <ImageWithFallback 
              src={isTreasury(asset) 
                ? `/images/treasury-${asset.treasury_type}.jpg`
                : getEnvironmentalAssetImage(asset)
              }
              alt={isTreasury(asset) ? asset.name : asset.project_name}
              style={{ height: "200px", width: "100%", objectFit: "cover" }}
              className="card-img-top"
            />
            <Card.Body>
              <h3 className="fs-5 fw-bold mb-3">Key Details</h3>
              <Row className="g-0 border-bottom pb-2 mb-2">
                <Col xs={6} className="text-muted">Price:</Col>
                <Col xs={6} className="text-end fw-bold">
                  ${isTreasury(asset) ? asset.current_price : asset.price_per_unit}
                </Col>
              </Row>
              
              {isTreasury(asset) && (
                <>
                  <Row className="g-0 border-bottom pb-2 mb-2">
                    <Col xs={6} className="text-muted">Yield Rate:</Col>
                    <Col xs={6} className="text-end fw-bold text-primary">
                      {(asset.yield_rate / 100).toFixed(2)}%
                    </Col>
                  </Row>
                  <Row className="g-0 border-bottom pb-2 mb-2">
                    <Col xs={6} className="text-muted">Maturity Date:</Col>
                    <Col xs={6} className="text-end">
                      {formatDate(asset.maturity_date)}
                    </Col>
                  </Row>
                  <Row className="g-0 border-bottom pb-2 mb-2">
                    <Col xs={6} className="text-muted">Status:</Col>
                    <Col xs={6} className="text-end">
                      <Badge bg={
                        asset.status === 'Active' ? 'success' : 
                        asset.status === 'Pending' ? 'warning' : 'secondary'
                      }>
                        {asset.status}
                      </Badge>
                    </Col>
                  </Row>
                </>
              )}
              
              {isEnvironmental(asset) && (
                <>
                  <Row className="g-0 border-bottom pb-2 mb-2">
                    <Col xs={6} className="text-muted">Standard:</Col>
                    <Col xs={6} className="text-end fw-bold">
                      {asset.standard}
                    </Col>
                  </Row>
                  <Row className="g-0 border-bottom pb-2 mb-2">
                    <Col xs={6} className="text-muted">Vintage Year:</Col>
                    <Col xs={6} className="text-end">
                      {asset.vintage_year}
                    </Col>
                  </Row>
                  {asset.change_24h && (
                    <Row className="g-0 border-bottom pb-2 mb-2">
                      <Col xs={6} className="text-muted">24h Change:</Col>
                      <Col xs={6} className={`text-end fw-bold ${asset.change_24h.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                        {asset.change_24h}
                      </Col>
                    </Row>
                  )}
                </>
              )}
              
              <Row className="g-0 mb-2">
                <Col xs={6} className="text-muted">Total Supply:</Col>
                <Col xs={6} className="text-end">
                  {parseInt(asset.total_supply).toLocaleString()}
                </Col>
              </Row>
            </Card.Body>
            <Card.Footer className="border-0" style={{ backgroundColor: 'var(--card-bg)' }}>
              <Button variant="primary" className="w-100 mb-2">Invest Now</Button>
              <Button variant="outline-primary" className="w-100">Add to Watchlist</Button>
            </Card.Footer>
          </Card>
        </Col>
        
        {/* Right column - Description and additional info */}
        <Col md={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <h3 className="fs-5 fw-bold mb-3">Description</h3>
              <p>{asset.description}</p>
              
              {isTreasury(asset) && (
                <div className="mt-4">
                  <h4 className="fs-6 fw-bold mb-3">Issuer Information</h4>
                  <p className="mb-4">{asset.issuer_description}</p>
                  
                  <Row className="row-cols-1 row-cols-md-2 g-3">
                    <Col>
                      <div className="border rounded p-3">
                        <div className="text-muted small mb-1">Issuer</div>
                        <div className="fw-bold">{asset.issuer}</div>
                      </div>
                    </Col>
                    <Col>
                      <div className="border rounded p-3">
                        <div className="text-muted small mb-1">Face Value</div>
                        <div className="fw-bold">${asset.face_value}</div>
                      </div>
                    </Col>
                    <Col>
                      <div className="border rounded p-3">
                        <div className="text-muted small mb-1">Auction Date</div>
                        <div className="fw-bold">{formatDate(asset.auction_date)}</div>
                      </div>
                    </Col>
                    <Col>
                      <div className="border rounded p-3">
                        <div className="text-muted small mb-1">Settlement Date</div>
                        <div className="fw-bold">{formatDate(asset.settlement_date)}</div>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
              
              {isEnvironmental(asset) && asset.impact_metrics && (
                <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'var(--gray-100)' }}>
                  <h4 className="fs-6 fw-bold mb-3">Impact Metrics</h4>
                  <Row className="row-cols-1 row-cols-md-2 g-3">
                    {asset.impact_metrics.carbon_offset_tons > 0 && (
                      <Col>
                        <div className="border rounded p-3" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-color)' }}>
                          <div className="small mb-1" style={{ color: 'var(--muted-color)' }}>Carbon Offset</div>
                          <div className="fw-bold">{asset.impact_metrics.carbon_offset_tons.toLocaleString()} tons</div>
                        </div>
                      </Col>
                    )}
                    {asset.impact_metrics.land_area_protected_hectares > 0 && (
                      <Col>
                        <div className="border rounded p-3" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-color)' }}>
                          <div className="small mb-1" style={{ color: 'var(--muted-color)' }}>Land Protected</div>
                          <div className="fw-bold">{asset.impact_metrics.land_area_protected_hectares.toLocaleString()} hectares</div>
                        </div>
                      </Col>
                    )}
                    {asset.impact_metrics.water_protected_liters > 0 && (
                      <Col>
                        <div className="border rounded p-3" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-color)' }}>
                          <div className="small mb-1" style={{ color: 'var(--muted-color)' }}>Water Protected</div>
                          <div className="fw-bold">{(asset.impact_metrics.water_protected_liters / 1000000).toLocaleString()} million liters</div>
                        </div>
                      </Col>
                    )}
                  </Row>
                </div>
              )}
              {isEnvironmental(asset) && (
                <Row className="g-0 pt-3 border-top mt-3">
                  <Col xs={12} className="mb-2">
                    <Link 
                      to={`/environmental/assets/${asset.asset_id}`}
                      className="btn btn-success btn-sm w-100"
                    >
                      <i className="bi bi-globe me-1"></i> View Environmental Impact Dashboard
                    </Link>
                  </Col>
                  <Col xs={12}>
                    <small className="text-muted">
                      Access detailed environmental metrics, impact data, and verification reports
                    </small>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
          
          {/* Technical Details */}
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h3 className="fs-5 fw-bold mb-3">Technical Details</h3>
              <Row className="g-0 border-bottom pb-2 mb-2">
                <Col xs={4} className="text-muted">
                  {isTreasury(asset) ? 'Token ID:' : 'Asset ID:'}
                </Col>
                <Col xs={8}>
                  <code className="px-2 py-1 rounded small" style={{ backgroundColor: 'var(--gray-100)', color: 'var(--text-color)' }}>
                    {isTreasury(asset) ? asset.token_id : asset.asset_id}
                  </code>
                </Col>
              </Row>
              <Row className="g-0 border-bottom pb-2 mb-2">
                <Col xs={4} className="text-muted">
                  {isTreasury(asset) ? 'Token Address:' : 'Contract Address:'}
                </Col>
                <Col xs={8}>
                  <code className="px-2 py-1 rounded small" style={{ backgroundColor: 'var(--gray-100)', color: 'var(--text-color)' }}>
                    {isTreasury(asset) 
                      ? asset.token_address 
                      : asset.security_details.contract_address}
                  </code>
                </Col>
              </Row>
              {isEnvironmental(asset) && (
                <Row className="g-0 border-bottom pb-2 mb-2">
                  <Col xs={4} className="text-muted">Blockchain:</Col>
                  <Col xs={8}>{asset.security_details.blockchain}</Col>
                </Row>
              )}
              {isEnvironmental(asset) && (
                <Row className="g-0 mb-2">
                  <Col xs={4} className="text-muted">Token Standard:</Col>
                  <Col xs={8}>{asset.security_details.token_standard}</Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AssetDetailPage; 