/**
 * Calculates Haversine distance between two coordinates in meters.
 */
export const calculateDistanceMeters = (coord1, coord2) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (coord1.lat * Math.PI) / 180;
    const phi2 = (coord2.lat * Math.PI) / 180;
    const deltaPhi = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const deltaLambda = ((coord2.lng - coord1.lng) * Math.PI) / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
};
/**
 * Calculates perpendicular proximity distance from a point to a line segment.
 */
export const distanceToSegmentMeters = (p, a, b) => {
    const l2 = (b.lat - a.lat) ** 2 + (b.lng - a.lng) ** 2;
    if (l2 === 0)
        return calculateDistanceMeters(p, a);
    let t = ((p.lat - a.lat) * (b.lat - a.lat) + (p.lng - a.lng) * (b.lng - a.lng)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projection = {
        lat: a.lat + t * (b.lat - a.lat),
        lng: a.lng + t * (b.lng - a.lng),
    };
    return calculateDistanceMeters(p, projection);
};
/**
 * Calculates projection scalar t of point p onto line segment passing from a to b.
 * t < 0: before point a
 * t = 0: exactly at point a
 * 0 < t < 1: between point a and b
 * t = 1: exactly at point b
 * t > 1: after point b
 */
export const calculateProjectionT = (p, a, b) => {
    const l2 = (b.lat - a.lat) ** 2 + (b.lng - a.lng) ** 2;
    if (l2 === 0)
        return 0;
    return ((p.lat - a.lat) * (b.lat - a.lat) + (p.lng - a.lng) * (b.lng - a.lng)) / l2;
};
/**
 * Calculates direction dot product between vector (a1 -> b1) and (a2 -> b2).
 * Positive (> 0): generally same direction.
 * Negative (<= 0): opposite direction.
 */
export const calculateDirectionAlignment = (a1, b1, a2, b2) => {
    const v1Lat = b1.lat - a1.lat;
    const v1Lng = b1.lng - a1.lng;
    const v2Lat = b2.lat - a2.lat;
    const v2Lng = b2.lng - a2.lng;
    return v1Lat * v2Lat + v1Lng * v2Lng;
};
/**
 * Calculates statutory cost-sharing price per passenger km based on fuel consumption and wear.
 */
export const calculateStatutoryCostShare = (distanceMeters, perKmCostShare, platformFeePercentage = 0.12, insuranceFeeFixed = 2.0) => {
    const distanceKm = distanceMeters / 1000;
    const fareFuelShare = Math.round(distanceKm * perKmCostShare * 100) / 100;
    const platformFee = Math.round(fareFuelShare * platformFeePercentage * 100) / 100;
    const totalFare = Math.round((fareFuelShare + platformFee + insuranceFeeFixed) * 100) / 100;
    return {
        distanceKm: Math.round(distanceKm * 10) / 10,
        fareFuelShare,
        platformFee,
        insuranceFee: insuranceFeeFixed,
        totalFare,
    };
};
