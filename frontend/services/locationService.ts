// Define the interface for a single location
// TODO - this should probably be in a "types/index.ts" file, deal with this when moving everything
export interface Location {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    hours: string;
    logo: ImageSourcePropType;
}

/**
 * Fetches location data from a backend API.
 * @returns {Promise<Location[]>} A promise that resolves to an array of locations.
 */
export const fetchLocations = async (): Promise<Location[]> => {

    console.log("Fetching locations from the backend.");

    // TODO: This is a mock API call. Replace it with the actual fetch() later
    return new Promise((resolve, reject) => {

        // Simulate a 1% chance of a network error
        if (Math.random() < 0.00) {
            // Reject the promise
            reject(new Error("Failed to fetch locations from the server. Please try again."));
        }
        // Simulate everything working as expected
        else {

            setTimeout(() => {
                const mockLocations: Location[] = [
                    { id: '1', name: 'AJ\'s Ultra Lounge', latitude: 42.02158, longitude: -93.64902, hours: "Open until 2:00 AM", logo: require('../assets/images/logos/AJs_Ultra_Lounge.png') },       // AJ's Ultra Lounge: 42.02158, -93.64902
                    { id: '2', name: 'BNC Field House', latitude: 42.02120, longitude: -93.64967, hours: "Open until 2:00 AM", logo: require('../assets/images/logos/bnc.png') },                       // BNC Field House: 42.02120, -93.64967
                    { id: '3', name: 'Cy\'s Roost', latitude: 42.02192, longitude: -93.65038, hours: "Open until 2:00 AM", logo: require('../assets/images/logos/Cys_Roost.png') },                     // Cy's Roost: 42.02192, -93.65038
                    { id: '4', name: 'Welch Ave. Station', latitude: 42.02108, longitude: -93.65031, hours: "Open until 2:00 AM", logo: require('../assets/images/logos/Welch_Ave_Station.png') },      // Welch Ave. Station: 42.02108, -93.65031
                    { id: '5', name: 'The Blue Owl', latitude: 42.02047, longitude: -93.65042, hours: "Open until 2:00 AM", logo: require('../assets/images/logos/blue_owl.png') },                     // The Blue Owl: 42.02047, -93.65042
                    { id: '6', name: 'Paddy\'s Irish Pub', latitude: 42.02185, longitude: -93.65005, hours: "Open until 2:00 AM", logo: require('../assets/images/logos/paddy.png') },                  // Paddy's Irish Pub: 42.02185, -93.65005
                    { id: '7', name: 'Sips', latitude: 42.02185, longitude: -93.65001, hours: "Open until 2:00 AM", logo: require('../assets/images/logos/sips.png') },                                 // Sips: 42.02185, -93.65001
                    { id: '8', name: 'Mickey\'s Irish Pub', latitude: 42.02234, longitude: -93.65031, hours: "Open until 2:00 AM", logo: require('../assets/images/logos/mickey.png') },                // Mickey's Irish Pub: 42.02234, -93.65031
                    { id: '9', name: 'Outlaws', latitude: 42.02139, longitude: -93.65123, hours: "Open until 2:00 AM", logo: require('../assets/images/logos/outlaws.png') },                           // Outlaws: 42.02139, -93.65123
                ];
                resolve(mockLocations);
            }, 1500);
        }
    });
};