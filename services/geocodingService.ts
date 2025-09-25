const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

/**
 * Searches for address suggestions based on a query, focused on São Paulo, Brazil.
 * @param query The search term.
 * @returns A promise that resolves to an array of address suggestions.
 */
export const searchAddress = async (query: string): Promise<AddressSuggestion[]> => {
    if (!query || query.length < 3) return [];

    // Bounding box for the state of São Paulo, Brazil, to prioritize results.
    const viewbox = '-53.11,-25.31,-44.16,-19.78';
    const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&countrycodes=br&viewbox=${viewbox}&bounded=1&limit=5`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Nominatim API responded with status ${response.status}`);
        }
        const data = await response.json();
        return data as AddressSuggestion[];
    } catch (error) {
        console.error('Address search error:', error);
        return [];
    }
};


/**
 * Geocodes an address string to latitude and longitude coordinates.
 * @param address The address to geocode.
 * @returns A promise that resolves to an object with lat and lon, or null if not found.
 */
export const geocode = async (address: string): Promise<{ lat: number; lon: number } | null> => {
    if (!address) return null;
    
    try {
        const response = await fetch(`${NOMINATIM_URL}?q=${encodeURIComponent(address)}&format=json&limit=1`);
        if (!response.ok) {
            throw new Error(`Nominatim API responded with status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
};