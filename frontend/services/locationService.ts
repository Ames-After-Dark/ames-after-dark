import { ImageSourcePropType } from 'react-native';
import { apiFetch } from './apiClient';
import { getLogoAssetForLocationName } from '@/utils/locationLogos';

// Define the interface for a single location
// TODO - this should probably be in a "types/index.ts" file
export interface Location {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    hours: string;
    logo: ImageSourcePropType;
}

interface LocationApiResponse {
    id: number;
    name: string;
    latitude: number | string;  
    longitude: number | string; 
    hours: string;
}

/**
 * Fetches location data from a backend API.
 * @returns {Promise<Location[]>} A promise that resolves to an array of locations.
 */
export const fetchLocations = async (): Promise<Location[]> => {

    // console.log("Fetching locations from the backend.");

    try {
        const apiLocations: LocationApiResponse[] = await apiFetch('/locations');
        // console.log("API response received:", apiLocations?.length, "locations");
        
        if (!Array.isArray(apiLocations)) {
            console.error("API response is not an array:", apiLocations);
            throw new Error("Invalid API response format");
        }

        const locations: Location[] = apiLocations
            .map((apiLoc, index) => {
                // console.log(`Processing location ${index + 1}:`, apiLoc.name, apiLoc.latitude, apiLoc.longitude);
                
                // Convert latitude and longitude to numbers if they're strings
                const latitude = typeof apiLoc.latitude === 'string' ? parseFloat(apiLoc.latitude) : apiLoc.latitude;
                const longitude = typeof apiLoc.longitude === 'string' ? parseFloat(apiLoc.longitude) : apiLoc.longitude;
                
                // Validate location data - return null for invalid locations
                if (!apiLoc.name || typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
                    console.warn(`Skipping location with invalid coordinates: ${apiLoc.name || 'unknown'}`, { latitude, longitude });
                    return null;
                }
                
                const logoAsset = getLogoAssetForLocationName(apiLoc.name);
                return {
                    id: String(apiLoc.id),
                    name: apiLoc.name,
                    latitude,
                    longitude,
                    hours: apiLoc.hours || 'Hours not available',
                    logo: logoAsset,
                };
            })
            .filter((location): location is Location => location !== null);

        console.log("Successfully processed", locations.length, "valid locations out of", apiLocations.length, "total");
        return locations;
    }
    catch (error) {
        console.error("Error in locationService.fetchLocations: ", error);
        throw new Error("Failed to fetch locations. Please try again.");
    }
};