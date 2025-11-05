/**
 * Country Coordinates Utility
 * Maps ISO 2-letter country codes to latitude/longitude coordinates
 * Used for positioning data points on the 3D globe
 */

export interface CountryCoordinate {
  lat: number;
  lng: number;
  name: string;
}

/**
 * Comprehensive mapping of ISO country codes to their approximate geographic centers
 * Data based on geographic centroids of countries
 */
export const COUNTRY_COORDINATES: Record<string, CountryCoordinate> = {
  // North America
  US: { lat: 37.0902, lng: -95.7129, name: 'United States' },
  CA: { lat: 56.1304, lng: -106.3468, name: 'Canada' },
  MX: { lat: 23.6345, lng: -102.5528, name: 'Mexico' },

  // Europe
  GB: { lat: 55.3781, lng: -3.436, name: 'United Kingdom' },
  FR: { lat: 46.2276, lng: 2.2137, name: 'France' },
  DE: { lat: 51.1657, lng: 10.4515, name: 'Germany' },
  IT: { lat: 41.8719, lng: 12.5674, name: 'Italy' },
  ES: { lat: 40.4637, lng: -3.7492, name: 'Spain' },
  PL: { lat: 51.9194, lng: 19.1451, name: 'Poland' },
  RO: { lat: 45.9432, lng: 24.9668, name: 'Romania' },
  NL: { lat: 52.1326, lng: 5.2913, name: 'Netherlands' },
  BE: { lat: 50.5039, lng: 4.4699, name: 'Belgium' },
  GR: { lat: 39.0742, lng: 21.8243, name: 'Greece' },
  PT: { lat: 39.3999, lng: -8.2245, name: 'Portugal' },
  CZ: { lat: 49.8175, lng: 15.473, name: 'Czech Republic' },
  HU: { lat: 47.1625, lng: 19.5033, name: 'Hungary' },
  SE: { lat: 60.1282, lng: 18.6435, name: 'Sweden' },
  AT: { lat: 47.5162, lng: 14.5501, name: 'Austria' },
  BG: { lat: 42.7339, lng: 25.4858, name: 'Bulgaria' },
  DK: { lat: 56.2639, lng: 9.5018, name: 'Denmark' },
  FI: { lat: 61.9241, lng: 25.7482, name: 'Finland' },
  SK: { lat: 48.669, lng: 19.699, name: 'Slovakia' },
  NO: { lat: 60.472, lng: 8.4689, name: 'Norway' },
  IE: { lat: 53.4129, lng: -8.2439, name: 'Ireland' },
  HR: { lat: 45.1, lng: 15.2, name: 'Croatia' },
  LT: { lat: 55.1694, lng: 23.8813, name: 'Lithuania' },
  SI: { lat: 46.1512, lng: 14.9955, name: 'Slovenia' },
  LV: { lat: 56.8796, lng: 24.6032, name: 'Latvia' },
  EE: { lat: 58.5953, lng: 25.0136, name: 'Estonia' },
  CH: { lat: 46.8182, lng: 8.2275, name: 'Switzerland' },
  RS: { lat: 44.0165, lng: 21.0059, name: 'Serbia' },
  UA: { lat: 48.3794, lng: 31.1656, name: 'Ukraine' },
  BY: { lat: 53.7098, lng: 27.9534, name: 'Belarus' },
  RU: { lat: 61.524, lng: 105.3188, name: 'Russia' },

  // Asia
  CN: { lat: 35.8617, lng: 104.1954, name: 'China' },
  IN: { lat: 20.5937, lng: 78.9629, name: 'India' },
  JP: { lat: 36.2048, lng: 138.2529, name: 'Japan' },
  KR: { lat: 35.9078, lng: 127.7669, name: 'South Korea' },
  ID: { lat: -0.7893, lng: 113.9213, name: 'Indonesia' },
  TR: { lat: 38.9637, lng: 35.2433, name: 'Turkey' },
  TH: { lat: 15.87, lng: 100.9925, name: 'Thailand' },
  SA: { lat: 23.8859, lng: 45.0792, name: 'Saudi Arabia' },
  PK: { lat: 30.3753, lng: 69.3451, name: 'Pakistan' },
  BD: { lat: 23.685, lng: 90.3563, name: 'Bangladesh' },
  VN: { lat: 14.0583, lng: 108.2772, name: 'Vietnam' },
  MY: { lat: 4.2105, lng: 101.9758, name: 'Malaysia' },
  PH: { lat: 12.8797, lng: 121.774, name: 'Philippines' },
  SG: { lat: 1.3521, lng: 103.8198, name: 'Singapore' },
  IQ: { lat: 33.2232, lng: 43.6793, name: 'Iraq' },
  AF: { lat: 33.9391, lng: 67.7099, name: 'Afghanistan' },
  MM: { lat: 21.9162, lng: 95.956, name: 'Myanmar' },
  KZ: { lat: 48.0196, lng: 66.9237, name: 'Kazakhstan' },
  AE: { lat: 23.4241, lng: 53.8478, name: 'United Arab Emirates' },
  IL: { lat: 31.0461, lng: 34.8516, name: 'Israel' },
  JO: { lat: 30.5852, lng: 36.2384, name: 'Jordan' },
  LK: { lat: 7.8731, lng: 80.7718, name: 'Sri Lanka' },
  NP: { lat: 28.3949, lng: 84.124, name: 'Nepal' },

  // South America
  BR: { lat: -14.235, lng: -51.9253, name: 'Brazil' },
  AR: { lat: -38.4161, lng: -63.6167, name: 'Argentina' },
  CO: { lat: 4.5709, lng: -74.2973, name: 'Colombia' },
  CL: { lat: -35.6751, lng: -71.543, name: 'Chile' },
  PE: { lat: -9.19, lng: -75.0152, name: 'Peru' },
  VE: { lat: 6.4238, lng: -66.5897, name: 'Venezuela' },
  EC: { lat: -1.8312, lng: -78.1834, name: 'Ecuador' },
  BO: { lat: -16.2902, lng: -63.5887, name: 'Bolivia' },
  PY: { lat: -23.4425, lng: -58.4438, name: 'Paraguay' },
  UY: { lat: -32.5228, lng: -55.7658, name: 'Uruguay' },

  // Africa
  ZA: { lat: -30.5595, lng: 22.9375, name: 'South Africa' },
  EG: { lat: 26.8206, lng: 30.8025, name: 'Egypt' },
  NG: { lat: 9.082, lng: 8.6753, name: 'Nigeria' },
  KE: { lat: -0.0236, lng: 37.9062, name: 'Kenya' },
  ET: { lat: 9.145, lng: 40.4897, name: 'Ethiopia' },
  GH: { lat: 7.9465, lng: -1.0232, name: 'Ghana' },
  TZ: { lat: -6.369, lng: 34.8888, name: 'Tanzania' },
  DZ: { lat: 28.0339, lng: 1.6596, name: 'Algeria' },
  MA: { lat: 31.7917, lng: -7.0926, name: 'Morocco' },
  AO: { lat: -11.2027, lng: 17.8739, name: 'Angola' },
  SD: { lat: 12.8628, lng: 30.2176, name: 'Sudan' },
  UG: { lat: 1.3733, lng: 32.2903, name: 'Uganda' },
  TN: { lat: 33.8869, lng: 9.5375, name: 'Tunisia' },
  ZW: { lat: -19.0154, lng: 29.1549, name: 'Zimbabwe' },
  LY: { lat: 26.3351, lng: 17.2283, name: 'Libya' },
  CM: { lat: 7.3697, lng: 12.3547, name: 'Cameroon' },
  SN: { lat: 14.4974, lng: -14.4524, name: 'Senegal' },

  // Oceania
  AU: { lat: -25.2744, lng: 133.7751, name: 'Australia' },
  NZ: { lat: -40.9006, lng: 174.886, name: 'New Zealand' },
  PG: { lat: -6.315, lng: 143.9555, name: 'Papua New Guinea' },
  FJ: { lat: -17.7134, lng: 178.065, name: 'Fiji' },

  // Central America & Caribbean
  GT: { lat: 15.7835, lng: -90.2308, name: 'Guatemala' },
  CU: { lat: 21.5218, lng: -77.7812, name: 'Cuba' },
  HT: { lat: 18.9712, lng: -72.2852, name: 'Haiti' },
  DO: { lat: 18.7357, lng: -70.1627, name: 'Dominican Republic' },
  HN: { lat: 15.2, lng: -86.2419, name: 'Honduras' },
  SV: { lat: 13.7942, lng: -88.8965, name: 'El Salvador' },
  NI: { lat: 12.8654, lng: -85.2072, name: 'Nicaragua' },
  CR: { lat: 9.7489, lng: -83.7534, name: 'Costa Rica' },
  PA: { lat: 8.538, lng: -80.7821, name: 'Panama' },
  JM: { lat: 18.1096, lng: -77.2975, name: 'Jamaica' },

  // Middle East
  IR: { lat: 32.4279, lng: 53.688, name: 'Iran' },
  SY: { lat: 34.8021, lng: 38.9968, name: 'Syria' },
  YE: { lat: 15.5527, lng: 48.5164, name: 'Yemen' },
  OM: { lat: 21.4735, lng: 55.9754, name: 'Oman' },
  KW: { lat: 29.3117, lng: 47.4818, name: 'Kuwait' },
  QA: { lat: 25.3548, lng: 51.1839, name: 'Qatar' },
  BH: { lat: 26.0667, lng: 50.5577, name: 'Bahrain' },
  LB: { lat: 33.8547, lng: 35.8623, name: 'Lebanon' },
};

/**
 * Get coordinates for a country code
 * Returns default coordinates (0, 0) if country code not found
 */
export function getCountryCoordinates(
  countryCode: string
): { lat: number; lng: number; name: string } {
  const coords = COUNTRY_COORDINATES[countryCode.toUpperCase()];
  return coords || { lat: 0, lng: 0, name: countryCode };
}

/**
 * Check if a country code has known coordinates
 */
export function hasCountryCoordinates(countryCode: string): boolean {
  return countryCode.toUpperCase() in COUNTRY_COORDINATES;
}

/**
 * Get all available country codes with coordinates
 */
export function getAvailableCountryCodes(): string[] {
  return Object.keys(COUNTRY_COORDINATES);
}
