// app/utils/getTextColorForBackground.ts

// Helper function to calculate brightness from a hex color
export function getBrightness(hex: string): number {
    // Remove the '#' character if present
    hex = hex.replace("#", "");

    // Convert to RGB components
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate brightness using relative luminance formula
    return (r * 299 + g * 587 + b * 114) / 1000;
}

// Function to determine the best text color (black or white) based on the background color's brightness
export function getTextColorForBackground(hex: string): string {
    const brightness = getBrightness(hex);
    // If brightness is greater than 128, use black text; otherwise, use white
    return brightness > 128 ? "text-black" : "text-white";
}
