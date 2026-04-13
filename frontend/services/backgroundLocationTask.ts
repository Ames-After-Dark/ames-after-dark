import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const NIGHT_OUT_TRACKING_TASK = 'NIGHT_OUT_TRACKING_TASK';

TaskManager.defineTask(NIGHT_OUT_TRACKING_TASK, async ({ data, error }) => {
    if (error) {
        console.error("Background task error:", error);
        return;
    }

    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        const currentLocation = locations[0];

        try {
            const expiryString = await AsyncStorage.getItem('trackingExpiry');

            if (expiryString) {
                const expiryTime = parseInt(expiryString, 10);

                if (Date.now() > expiryTime) {
                    console.log("Night out is over. Stopping background tracking.");
                    await Location.stopLocationUpdatesAsync(NIGHT_OUT_TRACKING_TASK);
                    await AsyncStorage.removeItem('trackingExpiry');
                    return;
                }
            }

            // Send to your backend/DB here!
            console.log("Background location updated:", currentLocation.coords);

        } catch (err) {
            console.error("Error processing background location:", err);
        }
    }
});