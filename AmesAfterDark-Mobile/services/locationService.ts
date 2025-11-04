
// Define the interface for a single location
// TODO - this should probably be in a "types/index.ts" file, deal with this when moving everything
export interface Location {
  id: string;
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
    //         { id: '1', name: 'Cy\'s Roost', latitude: 42.0220836666669, longitude: -93.65038310323678 },            // Cy's Roost: 42.0220836666669, -93.65038310323678
            { id: '1', name: 'Cy\'s Roost', latitude: 42.0220836666669, longitude: -93.65038310323678, hours: "Open until 2:00 AM" },            // Cy's Roost: 42.0220836666669, -93.65038310323678
    //         { id: '2', name: 'Sips', latitude: 42.02196000761982, longitude: -93.65000079345538 },                  // Sips: 42.02200782956225, -93.65003297996454
            { id: '2', name: 'Sips', latitude: 42.02196000761982, longitude: -93.65000079345538, hours: "Open until 2:00 AM" },                  // Sips: 42.02200782956225, -93.65003297996454
    //         { id: '3', name: 'Outlaws', latitude: 42.02147706795947, longitude: -93.65122397440044 },               // Outlaws: 42.02147706795947, -93.65122397440044
            { id: '3', name: 'Outlaws', latitude: 42.02147706795947, longitude: -93.65122397440044, hours: "Open until 2:00 AM" },               // Outlaws: 42.02147706795947, -93.65122397440044
    //         { id: '4', name: 'Welch Ave. Station', latitude: 42.02125404643046, longitude: -93.65033330801657 },    // Welch Ave. Station: 42.02125404643046, -93.65033330801657
            { id: '4', name: 'Welch Ave. Station', latitude: 42.02125404643046, longitude: -93.65033330801657, hours: "Open until 2:00 AM" },    // Welch Ave. Station: 42.02125404643046, -93.65033330801657
    //         { id: '5', name: 'AJ\'s Ultra Lounge', latitude: 42.021736089656294, longitude: -93.64858947254572 },   // AJ's Ultra Lounge : 42.021736089656294, -93.64858947254572
            { id: '5', name: 'AJ\'s Ultra Lounge', latitude: 42.02158, longitude: -93.64902, hours: "Open until 2:00 AM" },                      // AJ's Ultra Lounge : 42.02158, -93.64902
          ];
          resolve(mockLocations);
        }, 1500);
    }
  });
};