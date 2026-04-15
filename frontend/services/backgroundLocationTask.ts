import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserLocationService } from '@/services/userLocationService'; 

export const NIGHT_OUT_TRACKING_TASK = 'NIGHT_OUT_TRACKING_TASK';

TaskManager.defineTask(NIGHT_OUT_TRACKING_TASK, async ({ data, error }) => {
    if (error) {
        // console.error("Background task error:", error);
        // return;
        if (error.message?.includes("Code=0")) {
            // Do absolutely nothing, or just a quiet log
            // console.log("GPS signal lost momentarily."); 
            return;
        }

        // For actual critical errors, you can keep the log
        console.error("Critical Background Task Error:", error);
        return;
    }

    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        const currentLocation = locations[0];

        try {

            // Check if the night is over
            // const expiryString = await AsyncStorage.getItem('trackingExpiry');

            // if (expiryString) {
            //     const expiryTime = parseInt(expiryString, 10);

            //     if (Date.now() > expiryTime) {
            //         console.log("Night out is over. Stopping background tracking.");
            //         await Location.stopLocationUpdatesAsync(NIGHT_OUT_TRACKING_TASK);
            //         await AsyncStorage.removeItem('trackingExpiry');
            //         return;
            //     }
            // }

            const expiryString = await AsyncStorage.getItem('trackingExpiry');

            if (expiryString) {
                const expiryTime = parseInt(expiryString, 10);
                const currentTime = Date.now();

                console.log(`Checking Expiry: Now(${currentTime}) > Expiry(${expiryTime})`);

                if (currentTime > expiryTime) {
                    console.log("⏰ LIMIT REACHED: Killing task.");
                    await Location.stopLocationUpdatesAsync(NIGHT_OUT_TRACKING_TASK);
                    await AsyncStorage.removeItem('trackingExpiry');
                    await SecureStore.deleteItemAsync('user_token');
                    return;
                }
            }
            
            const token = await SecureStore.getItemAsync('user_token');
            
            if (!token) {
                console.log("No token found in background. User might be logged out.");
                return;
            }

            // 3. Fire the coordinates to your database!
            await UserLocationService.updateLocation(token, {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude
            });

            console.log(`✅ Background location saved to DB: ${currentLocation.coords.latitude}, ${currentLocation.coords.longitude}`);

        } catch (err) {
            console.error("Error processing background location:", err);
        }
    }
});