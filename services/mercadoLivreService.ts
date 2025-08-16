import { ReplacementPart } from '../types';

export type SuggestedPart = Omit<ReplacementPart, 'id' | 'equipmentId'>;

const API_URL = 'https://api.mercadolibre.com/sites/MLB/search';
const RESULT_LIMIT = 5;
const ACCESS_TOKEN = process.env.MERCADO_LIVRE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
    console.warn("MERCADO_LIVRE_ACCESS_TOKEN environment variable not set. Mercado Livre API calls will likely fail.");
}

/**
 * Searches for parts on Mercado Livre based on a query.
 * @param query The search term, typically the equipment model.
 * @returns A promise that resolves to an array of suggested parts.
 */
export const searchPartsOnMercadoLivre = async (query: string): Promise<SuggestedPart[]> => {
  if (!query || !ACCESS_TOKEN) {
    return [];
  }

  try {
    const response = await fetch(`${API_URL}?q=${encodeURIComponent(query)}&limit=${RESULT_LIMIT}`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Mercado Livre API responded with status ${response.status}`);
    }
    
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return [];
    }

    const mappedParts: SuggestedPart[] = data.results.map((item: any) => ({
      name: item.title,
      code: `ML-${item.id}`, // Prefix to denote source and avoid conflicts
      stockQuantity: item.available_quantity || 0,
      supplier: 'Mercado Livre',
    }));
    
    return mappedParts;

  } catch (error) {
    console.error("Error fetching parts from Mercado Livre:", error);
    // Return an empty array in case of error to not break the UI
    return [];
  }
};
