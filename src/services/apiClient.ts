import { Product, StoreLocation } from '@/types';

const API_BASE_URL = 'http://localhost:3000';

export class ApiClient {
  /**
   * Search for products with optional locationId for store-specific pricing
   */
  static async searchProducts(query: string, limit: number = 10, locationId?: string): Promise<Product[]> {
    try {
      let url = `${API_BASE_URL}/api/products/search?query=${encodeURIComponent(query)}&limit=${limit}`;
      if (locationId) {
        url += `&locationId=${encodeURIComponent(locationId)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('Search products error:', error);
      throw error;
    }
  }

  /**
   * Get product by UPC with optional locationId
   */
  static async getProduct(upc: string, locationId?: string): Promise<Product | null> {
    try {
      let url = `${API_BASE_URL}/api/products/${upc}`;
      if (locationId) {
        url += `?locationId=${encodeURIComponent(locationId)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return data.product || null;
    } catch (error) {
      console.error('Get product error:', error);
      throw error;
    }
  }

  /**
   * Search multiple products in batch
   */
  static async batchSearchProducts(queries: string[], locationId?: string): Promise<Product[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/batch-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queries, locationId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('Batch search error:', error);
      throw error;
    }
  }

  /**
   * Search Kroger store locations by ZIP code, coordinates, or radius
   */
  static async searchLocations(params: {
    zipCode?: string;
    latLong?: string;
    radiusInMiles?: number;
    limit?: number;
  } = {}): Promise<StoreLocation[]> {
    try {
      const queryParts: string[] = [];
      if (params.zipCode) queryParts.push(`zipCode=${encodeURIComponent(params.zipCode)}`);
      if (params.latLong) queryParts.push(`latLong=${encodeURIComponent(params.latLong)}`);
      if (params.radiusInMiles) queryParts.push(`radiusInMiles=${params.radiusInMiles}`);
      if (params.limit) queryParts.push(`limit=${params.limit}`);

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const response = await fetch(`${API_BASE_URL}/api/locations${queryString}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return data.locations || [];
    } catch (error) {
      console.error('Search locations error:', error);
      throw error;
    }
  }

  /**
   * Get single Kroger store location by ID
   */
  static async getLocation(locationId: string): Promise<StoreLocation | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/${locationId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return data.location || null;
    } catch (error) {
      console.error('Get location error:', error);
      throw error;
    }
  }

  /**
   * Test backend connection
   */
  static async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);

      if (!response.ok) {
        throw new Error('Backend not responding');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Connection test failed:', error);
      throw error;
    }
  }
}
