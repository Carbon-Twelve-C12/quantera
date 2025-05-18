// Direct definition of mock data
const NOW = Math.floor(Date.now() / 1000);
const DAY = 86400; // seconds in a day

export const treasuries = [
  {
    token_id: "tbill-3m-2023q4",
    token_address: "0xA1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    name: "3-Month T-Bill (Q4 2023)",
    symbol: "TBILL3M-2023Q4",
    description: "A 3-month Treasury Bill with maturity in December 2023. This short-term treasury security is sold at a discount to face value and pays no coupon interest. The yield is the difference between the purchase price and the face value paid at maturity.",
    treasury_type: "tbill",
    total_supply: "5000000",
    yield_rate: 375, // 3.75% in basis points
    maturity_date: NOW + (DAY * 30), // 30 days from now
    current_price: "98.25",
    status: "Active",
    issuer: "US Department of Treasury",
    issuer_description: "The United States Department of the Treasury is the national treasury of the federal government of the United States. It manages all federal finances and supervises national banks.",
    auction_date: NOW - (DAY * 90), // 90 days ago
    settlement_date: NOW - (DAY * 88), // 88 days ago
    face_value: "100.00",
    minimum_bid: "1000.00",
    issuance_size: "45000000000", // $45 billion
    custody_fee: 0.05, // 0.05% per annum
    liquidity_rating: "High",
    risk_rating: "AAA",
    historical_prices: [
      { date: NOW - (DAY * 80), price: '97.85' },
      { date: NOW - (DAY * 40), price: '98.15' },
      { date: NOW, price: '98.25' },
    ],
    recent_trades: [
      { date: NOW - (DAY * 1), quantity: '25000', price: '98.25', type: 'Buy' },
      { date: NOW - (DAY * 2), quantity: '50000', price: '98.24', type: 'Buy' },
    ],
    similar_treasuries: ['tnote-5y-2023q3', 'tbond-30y-2023q3'],
    documents: [
      { name: 'Term Sheet', url: '#', type: 'PDF', size_kb: 245 },
      { name: 'Auction Results', url: '#', type: 'PDF', size_kb: 178 },
    ],
  },
  {
    token_id: "tnote-5y-2023q3",
    token_address: "0xE5F6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6",
    name: "5-Year T-Note (Q3 2023)",
    symbol: "TNOTE5Y-2023Q3",
    description: "A 5-year Treasury Note with maturity in September 2028. This medium-term treasury security pays a fixed interest rate (coupon) every six months until maturity, at which point the face value is returned to the investor.",
    treasury_type: "tnote",
    total_supply: "15000000",
    yield_rate: 445, // 4.45% in basis points
    maturity_date: NOW + (DAY * 1825), // 1825 days from now (5 years)
    current_price: "94.25",
    status: "Active",
    issuer: "US Department of Treasury",
    issuer_description: "The United States Department of the Treasury is the national treasury of the federal government of the United States. It manages all federal finances and supervises national banks.",
    auction_date: NOW - (DAY * 65), // 65 days ago
    settlement_date: NOW - (DAY * 63), // 63 days ago
    face_value: "100.00",
    minimum_bid: "1000.00",
    issuance_size: "40000000000", // $40 billion
    custody_fee: 0.05, // 0.05% per annum
    liquidity_rating: "High",
    risk_rating: "AAA",
    historical_prices: [
      { date: NOW - (DAY * 55), price: '94.00' },
      { date: NOW - (DAY * 25), price: '94.15' },
      { date: NOW, price: '94.25' },
    ],
    recent_trades: [
      { date: NOW - (DAY * 1), quantity: '45000', price: '94.25', type: 'Buy' },
      { date: NOW - (DAY * 2), quantity: '55000', price: '94.24', type: 'Buy' },
    ],
    similar_treasuries: ['tbill-3m-2023q4', 'tbond-30y-2023q3'],
    documents: [
      { name: 'Term Sheet', url: '#', type: 'PDF', size_kb: 285 },
      { name: 'Auction Results', url: '#', type: 'PDF', size_kb: 195 },
      { name: 'Coupon Schedule', url: '#', type: 'PDF', size_kb: 165 },
    ],
    image_url: '/images/assets/treasury-notes/5-year-tnote-q3-2023.jpg'
  },
  {
    token_id: "tbond-30y-2023q3",
    token_address: "0xC3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
    name: "30-Year T-Bond (Q3 2023)",
    symbol: "TBOND30Y-2023Q3",
    description: "A 30-year Treasury Bond with maturity in September 2053. This long-term treasury security pays a fixed interest rate (coupon) every six months until maturity, at which point the face value is returned to the investor.",
    treasury_type: "tbond",
    total_supply: "12000000",
    yield_rate: 495, // 4.95% in basis points
    maturity_date: NOW + (DAY * 10950), // 10950 days from now (30 years)
    current_price: "91.00",
    status: "Active",
    issuer: "US Department of Treasury",
    issuer_description: "The United States Department of the Treasury is the national treasury of the federal government of the United States. It manages all federal finances and supervises national banks.",
    auction_date: NOW - (DAY * 85), // 85 days ago
    settlement_date: NOW - (DAY * 83), // 83 days ago
    face_value: "100.00",
    minimum_bid: "1000.00",
    issuance_size: "15000000000", // $15 billion
    custody_fee: 0.05, // 0.05% per annum
    liquidity_rating: "Medium",
    risk_rating: "AAA",
    historical_prices: [
      { date: NOW - (DAY * 75), price: '90.75' },
      { date: NOW - (DAY * 35), price: '90.95' },
      { date: NOW, price: '91.00' },
    ],
    recent_trades: [
      { date: NOW - (DAY * 1), quantity: '30000', price: '91.00', type: 'Buy' },
      { date: NOW - (DAY * 3), quantity: '35000', price: '90.99', type: 'Buy' },
    ],
    similar_treasuries: ['tbill-3m-2023q4', 'tnote-5y-2023q3'],
    documents: [
      { name: 'Term Sheet', url: '#', type: 'PDF', size_kb: 325 },
      { name: 'Auction Results', url: '#', type: 'PDF', size_kb: 215 },
      { name: 'Coupon Schedule', url: '#', type: 'PDF', size_kb: 205 },
    ],
  },
  {
    token_id: "re-mixeduse-seattle-2023",
    token_address: "0x6789012345678901234567890123456789012345",
    name: "Harbor District Mixed-Use Development",
    symbol: "HDMD-2023",
    description: "Premium mixed-use development in Seattle's revitalized harbor district featuring retail spaces, luxury condominiums, and boutique office spaces with waterfront views and sustainable design.",
    treasury_type: "realestate",
    total_supply: "15000",
    yield_rate: 820, // 8.20% in basis points
    maturity_date: NOW + (DAY * 3650), // 10 years (approximate for real estate)
    current_price: "420.00",
    status: "Active",
    issuer: "Pacific Northwest Properties",
    issuer_description: "Pacific Northwest Properties is a leading real estate development firm specializing in sustainable mixed-use developments in major urban centers across the Pacific Northwest region.",
    auction_date: NOW - (DAY * 45), // 45 days ago
    settlement_date: NOW - (DAY * 43), // 43 days ago
    face_value: "500.00",
    minimum_bid: "840.00",
    issuance_size: "6300000000", // $6.3 billion total project value
    custody_fee: 0.15, // 0.15% per annum
    liquidity_rating: "Medium",
    risk_rating: "A",
    historical_prices: [
      { date: NOW - (DAY * 40), price: '415.00' },
      { date: NOW - (DAY * 20), price: '418.50' },
      { date: NOW, price: '420.00' },
    ],
    recent_trades: [
      { date: NOW - (DAY * 1), quantity: '150', price: '420.00', type: 'Buy' },
      { date: NOW - (DAY * 2), quantity: '125', price: '419.75', type: 'Buy' },
    ],
    similar_treasuries: [],
    documents: [
      { name: 'Property Appraisal', url: '#', type: 'PDF', size_kb: 4250 },
      { name: 'Development Plan', url: '#', type: 'PDF', size_kb: 3850 },
      { name: 'Financial Projections', url: '#', type: 'PDF', size_kb: 2150 },
      { name: 'Environmental Assessment', url: '#', type: 'PDF', size_kb: 3100 },
    ],
    property_details: {
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
      occupancy_rate: 91.5,
      property_manager: 'Pacific Northwest Properties',
      legal_structure: 'Real Estate Investment Trust (REIT)'
    },
    image_url: '/images/assets/harbor-district/mixed-use-development.jpg'
  },
  {
    token_id: "scf-taiwan-semiconductor-2023",
    token_address: "0x7890123456789012345678901234567890123456",
    name: "Taiwan Semiconductor Supply Chain Finance",
    symbol: "TSSCF-2023",
    description: "Supply chain financing for semiconductor component manufacturer in Taiwan with multinational technology company buyers. This instrument provides liquidity to suppliers while offering investors exposure to the growing semiconductor industry.",
    treasury_type: "tradefinance",
    total_supply: "2850",
    yield_rate: 595, // 5.95% in basis points
    maturity_date: NOW + (DAY * 180), // 180 days standard for supply chain finance
    current_price: "95.50",
    status: "Active",
    issuer: "Global Trade Finance Partners",
    issuer_description: "Global Trade Finance Partners specializes in structuring and tokenizing trade finance instruments, with particular focus on technology supply chains in Asia.",
    auction_date: NOW - (DAY * 30), // 30 days ago
    settlement_date: NOW - (DAY * 28), // 28 days ago
    face_value: "100.00",
    minimum_bid: "9550.00",
    issuance_size: "285000000", // $285 million
    custody_fee: 0.10, // 0.10% per annum
    liquidity_rating: "Medium-High",
    risk_rating: "A-",
    historical_prices: [
      { date: NOW - (DAY * 25), price: '95.20' },
      { date: NOW - (DAY * 15), price: '95.35' },
      { date: NOW, price: '95.50' },
    ],
    recent_trades: [
      { date: NOW - (DAY * 1), quantity: '200', price: '95.50', type: 'Buy' },
      { date: NOW - (DAY * 3), quantity: '150', price: '95.40', type: 'Buy' },
    ],
    similar_treasuries: [],
    documents: [
      { name: 'Term Sheet', url: '#', type: 'PDF', size_kb: 1850 },
      { name: 'Buyer Credit Profile', url: '#', type: 'PDF', size_kb: 2250 },
      { name: 'Industry Analysis', url: '#', type: 'PDF', size_kb: 1950 },
    ],
    trade_details: {
      asset_type: "SUPPLY_CHAIN_FINANCE",
      recipient: "Taiwan Advanced Semiconductor Manufacturing",
      currency: "USD",
      fractional_units: 2850,
      minimum_investment: 100,
      settlement_currency: "USDC",
      risk_rating: 2
    },
    image_url: '/images/assets/supply-chain-finance/taiwan-semiconductor.jpg'
  },
  {
    token_id: "moneymarket-prime-2023",
    token_address: "0xD4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6",
    name: "Prime Money Market Fund",
    symbol: "PMMF-2023",
    description: "A prime money market fund that invests in high-quality, short-term debt securities issued by corporations and banks. Offers higher yields than government money market funds while maintaining a high level of safety and liquidity.",
    treasury_type: "moneymarket",
    total_supply: "25000000",
    yield_rate: 410, // 4.10% in basis points
    maturity_date: NOW + (DAY * 1), // Daily liquidity
    current_price: "1.00", // Money market funds maintain a stable NAV
    status: "Active",
    issuer: "Quantera Financial",
    issuer_description: "Quantera Financial is a leading provider of money market funds and short-term investment solutions. The firm focuses on delivering competitive yields while maintaining high credit quality and liquidity.",
    auction_date: NOW - (DAY * 1), // Daily auction
    settlement_date: NOW, // Same-day settlement
    face_value: "1.00",
    minimum_bid: "1000.00",
    issuance_size: "25000000000", // $25 billion
    custody_fee: 0.18, // 0.18% per annum (expense ratio)
    liquidity_rating: "Very High",
    risk_rating: "AA",
    historical_prices: [
      { date: NOW - (DAY * 30), price: '1.00' },
      { date: NOW - (DAY * 15), price: '1.00' },
      { date: NOW, price: '1.00' },
    ],
    recent_trades: [
      { date: NOW - (DAY * 1), quantity: '100000', price: '1.00', type: 'Buy' },
      { date: NOW - (DAY * 1), quantity: '75000', price: '1.00', type: 'Sell' },
    ],
    similar_treasuries: ['tbill-3m-2023q4'],
    documents: [
      { name: 'Fund Prospectus', url: '#', type: 'PDF', size_kb: 475 },
      { name: 'Holdings Report', url: '#', type: 'PDF', size_kb: 320 },
      { name: 'Expense Disclosure', url: '#', type: 'PDF', size_kb: 185 },
    ],
  }
]; 