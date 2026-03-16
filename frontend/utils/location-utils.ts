export function formatLastActive(updatedAt: string | Date): string {
    const now = new Date();
    const updated = new Date(updatedAt);
    const diffInSeconds = Math.floor((now.getTime() - updated.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    return "Over a day ago";
}