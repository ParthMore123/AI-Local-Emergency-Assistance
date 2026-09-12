function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateTravelMinutes(distanceKm) {
  // Rough urban travel estimate ~30 km/h average
  return Math.max(2, Math.round((distanceKm / 30) * 60));
}

function enrichWithDistance(services, lat, lng) {
  return services
    .map((service) => {
      const [serviceLng, serviceLat] = service.location.coordinates;
      const distanceKm = haversineKm(lat, lng, serviceLat, serviceLng);
      return {
        ...(typeof service.toObject === 'function' ? service.toObject() : service),
        distanceKm: Number(distanceKm.toFixed(2)),
        etaMinutes: estimateTravelMinutes(distanceKm),
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

module.exports = { haversineKm, estimateTravelMinutes, enrichWithDistance };
