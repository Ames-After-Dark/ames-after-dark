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

export interface MapLocation {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    hours?: string;
    logo?: any;
}

interface LocationApiResponse {
    id: number;
    name: string;
    latitude: number | string;
    longitude: number | string;
}

interface LocationHourRow {
    weekday_id?: number | string;
    open_time?: string;
    close_time?: string;
    open_time_utc?: string;
    close_time_utc?: string;
}

interface LocationHoursApiResponse {
    timezone?: string;
    location_hours?: LocationHourRow[];
}

function parseTimeToMinutes(value?: string): number | null {
    if (!value) {
        return null;
    }

    const match = value.match(/(\d{1,2}):(\d{2})/);
    if (!match) {
        return null;
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return null;
    }

    return hour * 60 + minute;
}

function format24HourTime(value?: string): string | undefined {
    const minutes = parseTimeToMinutes(value);
    if (minutes == null) {
        return undefined;
    }

    const hour24 = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const suffix = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

    return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function getWeekdayIdInTimezone(now: Date, timezone: string): number {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    const parts = Object.fromEntries(
        formatter.formatToParts(now).map((part) => [part.type, part.value])
    );

    const inTimezoneDate = new Date(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        0
    );

    return inTimezoneDate.getDay() + 1; // 1=Sun..7=Sat
}

function getHoursForToday(
    schedule: LocationHourRow[] | undefined,
    timezone = 'America/Chicago'
): string | undefined {
    if (!Array.isArray(schedule) || !schedule.length) {
        return undefined;
    }

    const todayId = getWeekdayIdInTimezone(new Date(), timezone);
    const todayRow = schedule.find((row) => Number(row.weekday_id) === todayId) ?? schedule[0];

    const open = format24HourTime(todayRow?.open_time ?? todayRow?.open_time_utc);
    const close = format24HourTime(todayRow?.close_time ?? todayRow?.close_time_utc);

    if (open && close) {
        return `${open} - ${close}`;
    }
    if (open) {
        return `From ${open}`;
    }
    if (close) {
        return `Until ${close}`;
    }

    return undefined;
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

        const locationResults = await Promise.all(
            apiLocations.map(async (apiLoc) => {
                // Convert latitude and longitude to numbers if they're strings
                const latitude = typeof apiLoc.latitude === 'string' ? parseFloat(apiLoc.latitude) : apiLoc.latitude;
                const longitude = typeof apiLoc.longitude === 'string' ? parseFloat(apiLoc.longitude) : apiLoc.longitude;

                // Validate location data - return null for invalid locations
                if (!apiLoc.name ||
                    typeof latitude !== 'number' ||
                    typeof longitude !== 'number' ||
                    isNaN(latitude) ||
                    isNaN(longitude) ||
                    latitude < -90 ||
                    latitude > 90 ||
                    longitude < -180 ||
                    longitude > 180) {
                    console.warn(`Skipping location with invalid coordinates: ${apiLoc.name || 'unknown'}`, { latitude, longitude });
                    return null;
                }

                const logoAsset = getLogoAssetForLocationName(apiLoc.name);
                let hoursText = 'Hours not available';

                try {
                    const hoursResponse = await apiFetch(`/locationhours/${apiLoc.id}`) as LocationHoursApiResponse;
                    const resolvedHours = getHoursForToday(
                        hoursResponse?.location_hours,
                        hoursResponse?.timezone || 'America/Chicago'
                    );

                    if (resolvedHours) {
                        hoursText = resolvedHours;
                    }
                } catch (hoursError) {
                    console.warn(`Unable to fetch hours for location ${apiLoc.id}`, hoursError);
                }

                return {
                    id: String(apiLoc.id),
                    name: apiLoc.name,
                    latitude,
                    longitude,
                    hours: hoursText,
                    logo: logoAsset,
                };
            })
        );

        const locations: Location[] = locationResults
            .filter((location): location is Location => location !== null);

        console.log("Successfully processed", locations.length, "valid locations out of", apiLocations.length, "total");
        return locations;
    }
    catch (error) {
        console.error("Error in locationService.fetchLocations: ", error);
        throw new Error("Failed to fetch locations. Please try again later.");
    }
};

export const fetchLocationById = async (id: string): Promise<Location | null> => {
    try {
        const apiLoc: LocationApiResponse = await apiFetch(`/locations/${id}`);

        // Reuse your existing conversion/validation logic
        const latitude = typeof apiLoc.latitude === 'string' ? parseFloat(apiLoc.latitude) : apiLoc.latitude;
        const longitude = typeof apiLoc.longitude === 'string' ? parseFloat(apiLoc.longitude) : apiLoc.longitude;

        if (!apiLoc.name || isNaN(latitude) || isNaN(longitude)) return null;

        return {
            id: String(apiLoc.id),
            name: apiLoc.name,
            latitude,
            longitude,
            logo: getLogoAssetForLocationName(apiLoc.name),
            hours: "...", // You can fetch hours here if needed
        };
    } catch (error) {
        console.error("Error fetching single location:", error);
        return null;
    }
};