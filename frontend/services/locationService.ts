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
    latitude: number;
    longitude: number;
    hours: string;
}

/**
 * Fetches location data from a backend API.
 * @returns {Promise<Location[]>} A promise that resolves to an array of locations.
 */
export const fetchLocations = async (): Promise<Location[]> => {

    console.log("Fetching locations from the backend.");

    try {
        const apiLocations: LocationApiResponse[] = await apiFetch('/locations');
        const locations: Location[] = apiLocations.map(apiLoc => {
            const logoAsset = getLogoAssetForLocationName(apiLoc.name);
            return {
                ...apiLoc,
                id: String(apiLoc.id),
                logo: logoAsset,
            };
        });

        return locations;
    }
    catch (error) {
        console.error("Error in locationService.fetchLocations: ", error);
        throw new Error("Failed to fetch locations. Please try again.");
    }
};