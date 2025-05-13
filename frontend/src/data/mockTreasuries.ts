import { TreasuryOverview } from '../api/generated';

export interface TreasuryDetail extends TreasuryOverview {
  description: string;
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
  total_supply: string;
  historical_prices: { date: number; price: string }[];
  recent_trades: { 
    date: number;
    quantity: string;
    price: string;
    type: 'Buy' | 'Sell';
  }[];
  similar_treasuries: string[]; // token_ids of similar treasuries
  documents: {
    name: string;
    url: string;
    type: 'PDF' | 'DOC' | 'TXT';
    size_kb: number;
  }[];
}

// Current timestamp for reference
const NOW = Math.floor(Date.now() / 1000);
const DAY = 86400; // seconds in a day

export const MOCK_TREASURIES: TreasuryDetail[] = [
  {
    token_id: 'tbill-3m-2023q4',
    token_address: '0xA1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    name: '3-Month T-Bill (Q4 2023)',
    symbol: 'TBILL3M-2023Q4',
    description: 'A 3-month Treasury Bill with maturity in December 2023. This short-term treasury security is sold at a discount to face value and pays no coupon interest. The yield is the difference between the purchase price and the face value paid at maturity.',
    treasury_type: 'tbill',
    total_supply: '5000000',
    yield_rate: 375, // 3.75% in basis points
    maturity_date: NOW + (DAY * 30), // 30 days from now
    current_price: '98.25',
    status: 'Active',
    issuer: 'US Department of Treasury',
    issuer_description: 'The United States Department of the Treasury is the national treasury of the federal government of the United States. It manages all federal finances and supervises national banks.',
    auction_date: NOW - (DAY * 90), // 90 days ago
    settlement_date: NOW - (DAY * 88), // 88 days ago
    face_value: '100.00',
    minimum_bid: '1000.00',
    issuance_size: '45000000000', // $45 billion
    custody_fee: 0.05, // 0.05% per annum
    liquidity_rating: 'High',
    risk_rating: 'AAA',
    historical_prices: [
      { date: NOW - (DAY * 80), price: '97.85' },
      { date: NOW - (DAY * 70), price: '97.95' },
      { date: NOW - (DAY * 60), price: '98.05' },
      { date: NOW - (DAY * 50), price: '98.10' },
      { date: NOW - (DAY * 40), price: '98.15' },
      { date: NOW - (DAY * 30), price: '98.20' },
      { date: NOW - (DAY * 20), price: '98.25' },
      { date: NOW - (DAY * 10), price: '98.25' },
      { date: NOW - (DAY * 5), price: '98.25' },
      { date: NOW, price: '98.25' },
    ],
    recent_trades: [
      { date: NOW - (DAY * 1), quantity: '25000', price: '98.25', type: 'Buy' },
      { date: NOW - (DAY * 1), quantity: '10000', price: '98.25', type: 'Sell' },
      { date: NOW - (DAY * 2), quantity: '50000', price: '98.24', type: 'Buy' },
      { date: NOW - (DAY * 3), quantity: '15000', price: '98.24', type: 'Buy' },
      { date: NOW - (DAY * 4), quantity: '30000', price: '98.23', type: 'Sell' },
    ],
    similar_treasuries: ['tbill-6m-2023q4', 'tbill-3m-2024q1'],
    documents: [
      { name: 'Term Sheet', url: '#', type: 'PDF', size_kb: 245 },
      { name: 'Auction Results', url: '#', type: 'PDF', size_kb: 178 },
      { name: 'Issuance Circular', url: '#', type: 'PDF', size_kb: 312 },
    ],
  },
  {
    token_id: 'tbill-6m-2023q4',
    token_address: '0xB2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    name: '6-Month T-Bill (Q4 2023)',
    symbol: 'TBILL6M-2023Q4',
    description: 'A 6-month Treasury Bill with maturity in March 2024. This short-term treasury security is sold at a discount to face value and pays no coupon interest. The yield is the difference between the purchase price and the face value paid at maturity.',
    treasury_type: 'tbill',
    total_supply: '7500000',
    yield_rate: 405, // 4.05% in basis points
    maturity_date: NOW + (DAY * 150), // 150 days from now
    current_price: '97.50',
    status: 'Active',
    issuer: 'US Department of Treasury',
    issuer_description: 'The United States Department of the Treasury is the national treasury of the federal government of the United States. It manages all federal finances and supervises national banks.',
    auction_date: NOW - (DAY * 30), // 30 days ago
    settlement_date: NOW - (DAY * 28), // 28 days ago
    face_value: '100.00',
    minimum_bid: '1000.00',
    issuance_size: '42000000000', // $42 billion
    custody_fee: 0.05, // 0.05% per annum
    liquidity_rating: 'High',
    risk_rating: 'AAA',
    historical_prices: [
      { date: NOW - (DAY * 25), price: '97.40' },
      { date: NOW - (DAY * 20), price: '97.42' },
      { date: NOW - (DAY * 15), price: '97.45' },
      { date: NOW - (DAY * 10), price: '97.47' },
      { date: NOW - (DAY * 5), price: '97.49' },
      { date: NOW, price: '97.50' },
    ],
    recent_trades: [
      { date: NOW - (DAY * 1), quantity: '30000', price: '97.50', type: 'Buy' },
      { date: NOW - (DAY * 2), quantity: '15000', price: '97.49', type: 'Sell' },
      { date: NOW - (DAY * 2), quantity: '40000', price: '97.49', type: 'Buy' },
      { date: NOW - (DAY * 3), quantity: '25000', price: '97.48', type: 'Buy' },
      { date: NOW - (DAY * 4), quantity: '20000', price: '97.47', type: 'Sell' },
    ],
    similar_treasuries: ['tbill-3m-2023q4', 'tbill-1y-2023q4'],
    documents: [
      { name: 'Term Sheet', url: '#', type: 'PDF', size_kb: 256 },
      { name: 'Auction Results', url: '#', type: 'PDF', size_kb: 182 },
      { name: 'Issuance Circular', url: '#', type: 'PDF', size_kb: 305 },
    ],
  },
  {
    token_id: 'tbill-1y-2023q4',
    token_address: '0xC3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    name: '1-Year T-Bill (Q4 2023)',
    symbol: 'TBILL1Y-2023Q4',
    description: 'A 1-year Treasury Bill with maturity in September 2024. This short-term treasury security is sold at a discount to face value and pays no coupon interest. The yield is the difference between the purchase price and the face value paid at maturity.',
    treasury_type: 'tbill',
    total_supply: '10000000',
    yield_rate: 425, // 4.25% in basis points
    maturity_date: NOW + (DAY * 340), // 340 days from now
    current_price: '95.90',
    status: 'Active',
    issuer: 'US Department of Treasury',
    issuer_description: 'The United States Department of the Treasury is the national treasury of the federal government of the United States. It manages all federal finances and supervises national banks.',
    auction_date: NOW - (DAY * 25), // 25 days ago
    settlement_date: NOW - (DAY * 23), // 23 days ago
    face_value: '100.00',
    minimum_bid: '1000.00',
    issuance_size: '38000000000', // $38 billion
    custody_fee: 0.05, // 0.05% per annum
    liquidity_rating: 'High',
    risk_rating: 'AAA',
    historical_prices: [
      { date: NOW - (DAY * 20), price: '95.85' },
      { date: NOW - (DAY * 15), price: '95.87' },
      { date: NOW - (DAY * 10), price: '95.88' },
      { date: NOW - (DAY * 5), price: '95.89' },
      { date: NOW, price: '95.90' },
    ],
    recent_trades: [
      { date: NOW - (DAY * 1), quantity: '35000', price: '95.90', type: 'Buy' },
      { date: NOW - (DAY * 1), quantity: '20000', price: '95.90', type: 'Sell' },
      { date: NOW - (DAY * 2), quantity: '45000', price: '95.89', type: 'Buy' },
      { date: NOW - (DAY * 3), quantity: '30000', price: '95.88', type: 'Buy' },
      { date: NOW - (DAY * 4), quantity: '25000', price: '95.87', type: 'Sell' },
    ],
    similar_treasuries: ['tbill-6m-2023q4', 'tnote-2y-2023q3'],
    documents: [
      { name: 'Term Sheet', url: '#', type: 'PDF', size_kb: 262 },
      { name: 'Auction Results', url: '#', type: 'PDF', size_kb: 185 },
      { name: 'Issuance Circular', url: '#', type: 'PDF', size_kb: 318 },
    ],
  },
  {
    token_id: 'tnote-2y-2023q3',
    token_address: '0xD4E5F6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
    name: '2-Year T-Note (Q3 2023)',
    symbol: 'TNOTE2Y-2023Q3',
    description: 'A 2-year Treasury Note with maturity in September 2025. This medium-term treasury security pays a fixed interest rate (coupon) every six months until maturity, at which point the face value is returned to the investor.',
    treasury_type: 'tnote',
    total_supply: '12000000',
    yield_rate: 415, // 4.15% in basis points
    maturity_date: NOW + (DAY * 730), // 730 days from now (2 years)
    current_price: '95.75',
    status: 'Active',
    issuer: 'US Department of Treasury',
    issuer_description: 'The United States Department of the Treasury is the national treasury of the federal government of the United States. It manages all federal finances and supervises national banks.',
    auction_date: NOW - (DAY * 60), // 60 days ago
    settlement_date: NOW - (DAY * 58), // 58 days ago
    face_value: '100.00',
    minimum_bid: '1000.00',
    issuance_size: '43000000000', // $43 billion
    custody_fee: 0.05, // 0.05% per annum
    liquidity_rating: 'High',
    risk_rating: 'AAA',
    historical_prices: [
      { date: NOW - (DAY * 50), price: '95.50' },
      { date: NOW - (DAY * 40), price: '95.55' },
      { date: NOW - (DAY * 30), price: '95.60' },
      { date: NOW - (DAY * 20), price: '95.65' },
      { date: NOW - (DAY * 10), price: '95.70' },
      { date: NOW - (DAY * 5), price: '95.75' },
      { date: NOW, price: '95.75' },
    ],
    recent_trades: [
      { date: NOW - (DAY * 1), quantity: '40000', price: '95.75', type: 'Buy' },
      { date: NOW - (DAY * 1), quantity: '25000', price: '95.75', type: 'Sell' },
      { date: NOW - (DAY * 2), quantity: '50000', price: '95.74', type: 'Buy' },
      { date: NOW - (DAY * 3), quantity: '35000', price: '95.73', type: 'Buy' },
      { date: NOW - (DAY * 4), quantity: '30000', price: '95.72', type: 'Sell' },
    ],
    similar_treasuries: ['tbill-1y-2023q4', 'tnote-5y-2023q3'],
    documents: [
      { name: 'Term Sheet', url: '#', type: 'PDF', size_kb: 275 },
      { name: 'Auction Results', url: '#', type: 'PDF', size_kb: 190 },
      { name: 'Issuance Circular', url: '#', type: 'PDF', size_kb: 325 },
      { name: 'Coupon Schedule', url: '#', type: 'PDF', size_kb: 145 },
    ],
  },
  {
    token_id: 'tnote-5y-2023q3',
    token_address: '0xE5F6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
    name: '5-Year T-Note (Q3 2023)',
    symbol: 'TNOTE5Y-2023Q3',
    description: 'A 5-year Treasury Note with maturity in September 2028. This medium-term treasury security pays a fixed interest rate (coupon) every six months until maturity, at which point the face value is returned to the investor.',
    treasury_type: 'tnote',
    total_supply: '15000000',
    yield_rate: 445, // 4.45% in basis points
    maturity_date: NOW + (DAY * 1825), // 1825 days from now (5 years)
    current_price: '94.25',
    status: 'Active',
    issuer: 'US Department of Treasury',
    issuer_description: 'The United States Department of the Treasury is the national treasury of the federal government of the United States. It manages all federal finances and supervises national banks.',
    auction_date: NOW - (DAY * 65), // 65 days ago
    settlement_date: NOW - (DAY * 63), // 63 days ago
    face_value: '100.00',
    minimum_bid: '1000.00',
    issuance_size: '40000000000', // $40 billion
    custody_fee: 0.05, // 0.05% per annum
    liquidity_rating: 'High',
    risk_rating: 'AAA',
    historical_prices: [
      { date: NOW - (DAY * 55), price: '94.00' },
      { date: NOW - (DAY * 45), price: '94.05' },
      { date: NOW - (DAY * 35), price: '94.10' },
      { date: NOW - (DAY * 25), price: '94.15' },
      { date: NOW - (DAY * 15), price: '94.20' },
      { date: NOW - (DAY * 5), price: '94.25' },
      { date: NOW, price: '94.25' },
    ],
    recent_trades: [
      { date: NOW - (DAY * 1), quantity: '45000', price: '94.25', type: 'Buy' },
      { date: NOW - (DAY * 1), quantity: '30000', price: '94.25', type: 'Sell' },
      { date: NOW - (DAY * 2), quantity: '55000', price: '94.24', type: 'Buy' },
      { date: NOW - (DAY * 3), quantity: '40000', price: '94.23', type: 'Buy' },
      { date: NOW - (DAY * 4), quantity: '35000', price: '94.22', type: 'Sell' },
    ],
    similar_treasuries: ['tnote-2y-2023q3', 'tnote-7y-2023q3', 'tbond-10y-2023q3'],
    documents: [
      { name: 'Term Sheet', url: '#', type: 'PDF', size_kb: 285 },
      { name: 'Auction Results', url: '#', type: 'PDF', size_kb: 195 },
      { name: 'Issuance Circular', url: '#', type: 'PDF', size_kb: 335 },
      { name: 'Coupon Schedule', url: '#', type: 'PDF', size_kb: 165 },
    ],
  },
  {
    token_id: 'tnote-7y-2023q3',
    token_address: '0xF6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1',
    name: '7-Year T-Note (Q3 2023)',
    symbol: 'TNOTE7Y-2023Q3',
    description: 'A 7-year Treasury Note with maturity in September 2030. This medium-term treasury security pays a fixed interest rate (coupon) every six months until maturity, at which point the face value is returned to the investor.',
    treasury_type: 'tnote',
    total_supply: '17000000',
    yield_rate: 460, // 4.60% in basis points
    maturity_date: NOW + (DAY * 2555), // 2555 days from now (7 years)
    current_price: '93.50',
    status: 'Active',
    issuer: 'US Department of Treasury',
    issuer_description: 'The United States Department of the Treasury is the national treasury of the federal government of the United States. It manages all federal finances and supervises national banks.',
    auction_date: NOW - (DAY * 70), // 70 days ago
    settlement_date: NOW - (DAY * 68), // 68 days ago
    face_value: '100.00',
    minimum_bid: '1000.00',
    issuance_size: '34000000000', // $34 billion
    custody_fee: 0.05, // 0.05% per annum
    liquidity_rating: 'Medium',
    risk_rating: 'AAA',
    historical_prices: [
      { date: NOW - (DAY * 60), price: '93.25' },
      { date: NOW - (DAY * 50), price: '93.30' },
      { date: NOW - (DAY * 40), price: '93.35' },
      { date: NOW - (DAY * 30), price: '93.40' },
      { date: NOW - (DAY * 20), price: '93.45' },
      { date: NOW - (DAY * 10), price: '93.50' },
      { date: NOW, price: '93.50' },
    ],
    recent_trades: [
      { date: NOW - (DAY * 1), quantity: '40000', price: '93.50', type: 'Buy' },
      { date: NOW - (DAY * 2), quantity: '25000', price: '93.50', type: 'Sell' },
      { date: NOW - (DAY * 3), quantity: '50000', price: '93.49', type: 'Buy' },
      { date: NOW - (DAY * 4), quantity: '35000', price: '93.48', type: 'Buy' },
      { date: NOW - (DAY * 5), quantity: '30000', price: '93.47', type: 'Sell' },
    ],
    similar_treasuries: ['tnote-5y-2023q3', 'tbond-10y-2023q3'],
    documents: [
      { name: 'Term Sheet', url: '#', type: 'PDF', size_kb: 290 },
      { name: 'Auction Results', url: '#', type: 'PDF', size_kb: 198 },
      { name: 'Issuance Circular', url: '#', type: 'PDF', size_kb: 342 },
      { name: 'Coupon Schedule', url: '#', type: 'PDF', size_kb: 175 },
    ],
  },
  {
    token_id: 'tbond-10y-2023q3',
    token_address: '0xA1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    name: '10-Year T-Bond (Q3 2023)',
    symbol: 'TBOND10Y-2023Q3',
    description: 'A 10-year Treasury Bond with maturity in September 2033. This long-term treasury security pays a fixed interest rate (coupon) every six months until maturity, at which point the face value is returned to the investor.',
    treasury_type: 'tbond',
    total_supply: '20000000',
    yield_rate: 465, // 4.65% in basis points
    maturity_date: NOW + (DAY * 3650), // 3650 days from now (10 years)
    current_price: '92.50',
    status: 'Active',
    issuer: 'US Department of Treasury',
    issuer_description: 'The United States Department of the Treasury is the national treasury of the federal government of the United States. It manages all federal finances and supervises national banks.',
    auction_date: NOW - (DAY * 75), // 75 days ago
    settlement_date: NOW - (DAY * 73), // 73 days ago
    face_value: '100.00',
    minimum_bid: '1000.00',
    issuance_size: '35000000000', // $35 billion
    custody_fee: 0.05, // 0.05% per annum
    liquidity_rating: 'High',
    risk_rating: 'AAA',
    historical_prices: [
      { date: NOW - (DAY * 65), price: '92.25' },
      { date: NOW - (DAY * 55), price: '92.30' },
      { date: NOW - (DAY * 45), price: '92.35' },
      { date: NOW - (DAY * 35), price: '92.40' },
      { date: NOW - (DAY * 25), price: '92.45' },
      { date: NOW - (DAY * 15), price: '92.50' },
      { date: NOW - (DAY * 5), price: '92.50' },
      { date: NOW, price: '92.50' },
    ],
    recent_trades: [
      { date: NOW - (DAY * 1), quantity: '50000', price: '92.50', type: 'Buy' },
      { date: NOW - (DAY * 2), quantity: '35000', price: '92.50', type: 'Sell' },
      { date: NOW - (DAY * 3), quantity: '60000', price: '92.49', type: 'Buy' },
      { date: NOW - (DAY * 4), quantity: '45000', price: '92.48', type: 'Buy' },
      { date: NOW - (DAY * 5), quantity: '40000', price: '92.47', type: 'Sell' },
    ],
    similar_treasuries: ['tnote-7y-2023q3', 'tbond-20y-2023q3'],
    documents: [
      { name: 'Term Sheet', url: '#', type: 'PDF', size_kb: 305 },
      { name: 'Auction Results', url: '#', type: 'PDF', size_kb: 205 },
      { name: 'Issuance Circular', url: '#', type: 'PDF', size_kb: 355 },
      { name: 'Coupon Schedule', url: '#', type: 'PDF', size_kb: 185 },
    ],
  },
  {
    token_id: 'tbond-20y-2023q3',
    token_address: '0xB2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    name: '20-Year T-Bond (Q3 2023)',
    symbol: 'TBOND20Y-2023Q3',
    description: 'A 20-year Treasury Bond with maturity in September 2043. This long-term treasury security pays a fixed interest rate (coupon) every six months until maturity, at which point the face value is returned to the investor.',
    treasury_type: 'tbond',
    total_supply: '15000000',
    yield_rate: 480, // 4.80% in basis points
    maturity_date: NOW + (DAY * 7300), // 7300 days from now (20 years)
    current_price: '91.75',
    status: 'Active',
    issuer: 'US Department of Treasury',
    issuer_description: 'The United States Department of the Treasury is the national treasury of the federal government of the United States. It manages all federal finances and supervises national banks.',
    auction_date: NOW - (DAY * 80), // 80 days ago
    settlement_date: NOW - (DAY * 78), // 78 days ago
    face_value: '100.00',
    minimum_bid: '1000.00',
    issuance_size: '14000000000', // $14 billion
    custody_fee: 0.05, // 0.05% per annum
    liquidity_rating: 'Medium',
    risk_rating: 'AAA',
    historical_prices: [
      { date: NOW - (DAY * 70), price: '91.50' },
      { date: NOW - (DAY * 60), price: '91.55' },
      { date: NOW - (DAY * 50), price: '91.60' },
      { date: NOW - (DAY * 40), price: '91.65' },
      { date: NOW - (DAY * 30), price: '91.70' },
      { date: NOW - (DAY * 20), price: '91.75' },
      { date: NOW - (DAY * 10), price: '91.75' },
      { date: NOW, price: '91.75' },
    ],
    recent_trades: [
      { date: NOW - (DAY * 1), quantity: '35000', price: '91.75', type: 'Buy' },
      { date: NOW - (DAY * 2), quantity: '20000', price: '91.75', type: 'Sell' },
      { date: NOW - (DAY * 3), quantity: '40000', price: '91.74', type: 'Buy' },
      { date: NOW - (DAY * 4), quantity: '25000', price: '91.73', type: 'Buy' },
      { date: NOW - (DAY * 5), quantity: '30000', price: '91.72', type: 'Sell' },
    ],
    similar_treasuries: ['tbond-10y-2023q3', 'tbond-30y-2023q3'],
    documents: [
      { name: 'Term Sheet', url: '#', type: 'PDF', size_kb: 315 },
      { name: 'Auction Results', url: '#', type: 'PDF', size_kb: 210 },
      { name: 'Issuance Circular', url: '#', type: 'PDF', size_kb: 365 },
      { name: 'Coupon Schedule', url: '#', type: 'PDF', size_kb: 195 },
    ],
  },
  {
    token_id: 'tbond-30y-2023q3',
    token_address: '0xC3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    name: '30-Year T-Bond (Q3 2023)',
    symbol: 'TBOND30Y-2023Q3',
    description: 'A 30-year Treasury Bond with maturity in September 2053. This long-term treasury security pays a fixed interest rate (coupon) every six months until maturity, at which point the face value is returned to the investor.',
    treasury_type: 'tbond',
    total_supply: '12000000',
    yield_rate: 495, // 4.95% in basis points
    maturity_date: NOW + (DAY * 10950), // 10950 days from now (30 years)
    current_price: '91.00',
    status: 'Active',
    issuer: 'US Department of Treasury',
    issuer_description: 'The United States Department of the Treasury is the national treasury of the federal government of the United States. It manages all federal finances and supervises national banks.',
    auction_date: NOW - (DAY * 85), // 85 days ago
    settlement_date: NOW - (DAY * 83), // 83 days ago
    face_value: '100.00',
    minimum_bid: '1000.00',
    issuance_size: '15000000000', // $15 billion
    custody_fee: 0.05, // 0.05% per annum
    liquidity_rating: 'Medium',
    risk_rating: 'AAA',
    historical_prices: [
      { date: NOW - (DAY * 75), price: '90.75' },
      { date: NOW - (DAY * 65), price: '90.80' },
      { date: NOW - (DAY * 55), price: '90.85' },
      { date: NOW - (DAY * 45), price: '90.90' },
      { date: NOW - (DAY * 35), price: '90.95' },
      { date: NOW - (DAY * 25), price: '91.00' },
      { date: NOW - (DAY * 15), price: '91.00' },
      { date: NOW - (DAY * 5), price: '91.00' },
      { date: NOW, price: '91.00' },
    ],
    recent_trades: [
      { date: NOW - (DAY * 1), quantity: '30000', price: '91.00', type: 'Buy' },
      { date: NOW - (DAY * 2), quantity: '15000', price: '91.00', type: 'Sell' },
      { date: NOW - (DAY * 3), quantity: '35000', price: '90.99', type: 'Buy' },
      { date: NOW - (DAY * 4), quantity: '20000', price: '90.98', type: 'Buy' },
      { date: NOW - (DAY * 5), quantity: '25000', price: '90.97', type: 'Sell' },
    ],
    similar_treasuries: ['tbond-20y-2023q3'],
    documents: [
      { name: 'Term Sheet', url: '#', type: 'PDF', size_kb: 325 },
      { name: 'Auction Results', url: '#', type: 'PDF', size_kb: 215 },
      { name: 'Issuance Circular', url: '#', type: 'PDF', size_kb: 375 },
      { name: 'Coupon Schedule', url: '#', type: 'PDF', size_kb: 205 },
    ],
  }
]; 