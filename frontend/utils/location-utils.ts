
/**
 * Formats the last time that the user's friend(s) were active.
 */
export function formatLastActive(updatedAt: string | Date): string {
    const now = new Date();
    const updated = new Date(updatedAt);

    // Guard against invalid timestamps
    if (Number.isNaN(updated.getTime())) {
        return "unknown";
    }

    // Compute difference and guard against future timestamps
    let diffMs = now.getTime() - updated.getTime();
    if (diffMs < 0) {
        diffMs = 0;
    }

    const diffInSeconds = Math.floor(diffMs / 1000);

    if (diffInSeconds < 60) return "just now";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    return "over a day ago";
}

/**
 * Calculates the distance between two lat/lon points in meters using the Haversine formula
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};