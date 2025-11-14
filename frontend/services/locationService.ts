import { ImageSourcePropType } from 'react-native';
import { apiFetch } from './apiClient';

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

const logoAssetMap: { [key: string]: ImageSourcePropType } = {
    'AJ\'s Ultralounge': require('../assets/images/logos/AJs_Ultra_Lounge.png'),
    'BNC Fieldhouse': require('../assets/images/logos/bnc.png'),
    'Cy\'s Roost': require('../assets/images/logos/Cys_Roost.png'),
    'Welch Ave Station': require('../assets/images/logos/Welch_Ave_Station.png'),
    'The Blue Owl Bar': require('../assets/images/logos/blue_owl.png'),
    'Paddy\'s Irish Pub': require('../assets/images/logos/paddy.png'),
    'Sips': require('../assets/images/logos/sips.png'),
    'Mickey\'s Irish Pub': require('../assets/images/logos/mickey.png'),
    'Outlaws': require('../assets/images/logos/outlaws.png'),

    'default': require('../assets/images/Logo.png')
};

/**
 * Fetches location data from a backend API.
 * @returns {Promise<Location[]>} A promise that resolves to an array of locations.
 */
export const fetchLocations = async (): Promise<Location[]> => {

    console.log("Fetching locations from the backend.");

    try {
        const apiLocations: LocationApiResponse[] = await apiFetch('/locations');
        const locations: Location[] = apiLocations.map(apiLoc => {
            const logoAsset = logoAssetMap[apiLoc.name] || logoAssetMap['default'];
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