import {
  Configuration,
  DefaultApi,
  CreateTreasuryRequest,
  TreasuryOverview,
  TreasuriesIdYieldGet200Response
} from './generated';
import axios, { AxiosError } from 'axios';

/**
 * Error response format from the treasury service
 */
export interface TreasuryServiceError {
  statusCode: number;
  message: string;
  details?: unknown;
}

/**
 * Service for interacting with the Treasury API
 */
export class TreasuryService {
  private api: DefaultApi;

  constructor(baseUrl: string = 'http://localhost:3030') {
    const config = new Configuration({ basePath: baseUrl });
    this.api = new DefaultApi(config);
  }

  /**
   * List treasuries with optional filtering
   */
  async listTreasuries(
    treasuryType?: string,
    minYield?: number,
    maxMaturity?: number,
    limit?: number,
    offset?: number
  ): Promise<TreasuryOverview[]> {
    try {
      const response = await this.api.treasuriesGet(
        treasuryType as any,
        minYield,
        maxMaturity,
        limit,
        offset
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
      return []; // This line is unreachable, but TypeScript requires it
    }
  }

  /**
   * Get details of a specific treasury
   */
  async getTreasuryDetails(id: string): Promise<TreasuryOverview> {
    try {
      const response = await this.api.treasuriesIdGet(id);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
      throw error; // Unreachable
    }
  }

  /**
   * Get yield information for a treasury
   */
  async getTreasuryYield(id: string): Promise<TreasuriesIdYieldGet200Response> {
    try {
      const response = await this.api.treasuriesIdYieldGet(id);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
      throw error; // Unreachable
    }
  }

  /**
   * Create a new treasury
   */
  async createTreasury(data: CreateTreasuryRequest): Promise<TreasuryOverview> {
    try {
      const response = await this.api.treasuriesPost(data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
      throw error; // Unreachable
    }
  }

  /**
   * Handle API errors with appropriate messages
   */
  private handleApiError(error: AxiosError): never {
    const statusCode = error.response?.status || 500;
    let message = 'An unknown error occurred';
    
    if (error.response?.data) {
      const errorData = error.response.data as any;
      message = errorData.message || message;
    }

    if (statusCode === 401) {
      message = 'Unauthorized: Please check your authentication';
    } else if (statusCode === 403) {
      message = 'Forbidden: You do not have permission to perform this action';
    } else if (statusCode === 404) {
      message = 'Treasury not found';
    } else if (statusCode === 400) {
      message = 'Invalid request parameters';
    } else if (statusCode === 500) {
      message = 'Server error: Please try again later';
    }

    throw new Error(`Treasury service error (${statusCode}): ${message}`);
  }
}

// Export a singleton instance for use throughout the application
export const treasuryService = new TreasuryService(); 