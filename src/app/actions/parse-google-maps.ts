"use server";

export async function parseGoogleMapsUrl(url: string): Promise<{ lat: number; lng: number } | null> {
    if (!url) return null;

    try {
        let finalUrl = url;

        // Handle short links (e.g. maps.app.goo.gl)
        if (url.includes("goo.gl") || url.includes("maps.app.goo.gl")) {
            try {
                // Let fetch follow redirects automatically
                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                    }
                });
                finalUrl = response.url;

                // Fallback: If URL doesn't contain coords, check HTML content
                // Google often returns a page with client-side redirect or og:image with coords
                const html = await response.text();

                // Look for static map URL in meta tags which contains center coordinates
                // Example: center=49.7417517%2C13.3683538
                const staticMapRegex = /center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/;
                const staticMatch = html.match(staticMapRegex);
                if (staticMatch) {
                    console.log("Found coords in HTML static map:", staticMatch[1], staticMatch[2]);
                    return { lat: parseFloat(staticMatch[1]), lng: parseFloat(staticMatch[2]) };
                }

                // Look for init data containing coords
                // often in window.APP_INITIALIZATION_STATE or similar JSON structures
                // Trying a broad search for coordinates near the location name won't be reliable
                // But looking for !3d...!4d in the HTML might work if it's in a link
                const probRegexHTML = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
                const probMatchHTML = html.match(probRegexHTML);
                if (probMatchHTML) {
                    return { lat: parseFloat(probMatchHTML[1]), lng: parseFloat(probMatchHTML[2]) };
                }

            } catch (e) {
                console.warn("Failed to expand or parse short URL:", e);
                // Continue with parsed finalUrl
            }
        }

        console.log("Parsing Final URL:", finalUrl);

        // Pattern 1: @lat,lon
        // Example: https://www.google.com/maps/place/.../@50.0535424,15.7093327,17z
        const atRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        const atMatch = finalUrl.match(atRegex);
        if (atMatch) {
            return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
        }

        // Pattern 2: !3d and !4d (common in embed URLs or strict mode)
        // Example: !3d50.0535424!4d15.7093327
        const probRegex = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
        const probMatch = finalUrl.match(probRegex);
        if (probMatch) {
            return { lat: parseFloat(probMatch[1]), lng: parseFloat(probMatch[2]) };
        }

        // Pattern 3: q=lat,lon
        // Example: https://maps.google.com/?q=50.0535424,15.7093327
        const qRegex = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
        const qMatch = finalUrl.match(qRegex);
        if (qMatch) {
            return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
        }

        return null;
    } catch (error) {
        console.error("Error parsing Google Maps URL:", error);
        return null;
    }
}
