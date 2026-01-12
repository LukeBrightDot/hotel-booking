import { Location } from '@/types/location';

/**
 * Curated dataset of popular airports and cities for autocomplete
 * Priority: 1 = Most popular, 5 = Less common
 */
export const LOCATIONS: Location[] = [
  // ============ MAJOR US AIRPORTS ============
  {
    id: 'jfk-airport',
    type: 'airport',
    code: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    countryCode: 'US',
    lat: 40.6413,
    lng: -73.7781,
    searchPriority: 1,
  },
  {
    id: 'lga-airport',
    type: 'airport',
    code: 'LGA',
    name: 'LaGuardia Airport',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    countryCode: 'US',
    lat: 40.7769,
    lng: -73.8740,
    searchPriority: 2,
  },
  {
    id: 'ewr-airport',
    type: 'airport',
    code: 'EWR',
    name: 'Newark Liberty International Airport',
    city: 'Newark',
    state: 'NJ',
    country: 'United States',
    countryCode: 'US',
    lat: 40.6895,
    lng: -74.1745,
    searchPriority: 2,
  },
  {
    id: 'lax-airport',
    type: 'airport',
    code: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    state: 'CA',
    country: 'United States',
    countryCode: 'US',
    lat: 33.9416,
    lng: -118.4085,
    searchPriority: 1,
  },
  {
    id: 'ord-airport',
    type: 'airport',
    code: 'ORD',
    name: "O'Hare International Airport",
    city: 'Chicago',
    state: 'IL',
    country: 'United States',
    countryCode: 'US',
    lat: 41.9742,
    lng: -87.9073,
    searchPriority: 1,
  },
  {
    id: 'mdw-airport',
    type: 'airport',
    code: 'MDW',
    name: 'Chicago Midway International Airport',
    city: 'Chicago',
    state: 'IL',
    country: 'United States',
    countryCode: 'US',
    lat: 41.7868,
    lng: -87.7522,
    searchPriority: 2,
  },
  {
    id: 'dfw-airport',
    type: 'airport',
    code: 'DFW',
    name: 'Dallas/Fort Worth International Airport',
    city: 'Dallas',
    state: 'TX',
    country: 'United States',
    countryCode: 'US',
    lat: 32.8998,
    lng: -97.0403,
    searchPriority: 1,
  },
  {
    id: 'mia-airport',
    type: 'airport',
    code: 'MIA',
    name: 'Miami International Airport',
    city: 'Miami',
    state: 'FL',
    country: 'United States',
    countryCode: 'US',
    lat: 25.7959,
    lng: -80.2870,
    searchPriority: 1,
  },
  {
    id: 'sfo-airport',
    type: 'airport',
    code: 'SFO',
    name: 'San Francisco International Airport',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    countryCode: 'US',
    lat: 37.6213,
    lng: -122.3790,
    searchPriority: 1,
  },
  {
    id: 'sea-airport',
    type: 'airport',
    code: 'SEA',
    name: 'Seattle-Tacoma International Airport',
    city: 'Seattle',
    state: 'WA',
    country: 'United States',
    countryCode: 'US',
    lat: 47.4502,
    lng: -122.3088,
    searchPriority: 1,
  },
  {
    id: 'atl-airport',
    type: 'airport',
    code: 'ATL',
    name: 'Hartsfield-Jackson Atlanta International Airport',
    city: 'Atlanta',
    state: 'GA',
    country: 'United States',
    countryCode: 'US',
    lat: 33.6407,
    lng: -84.4277,
    searchPriority: 1,
  },
  {
    id: 'bos-airport',
    type: 'airport',
    code: 'BOS',
    name: 'Boston Logan International Airport',
    city: 'Boston',
    state: 'MA',
    country: 'United States',
    countryCode: 'US',
    lat: 42.3656,
    lng: -71.0096,
    searchPriority: 1,
  },
  {
    id: 'den-airport',
    type: 'airport',
    code: 'DEN',
    name: 'Denver International Airport',
    city: 'Denver',
    state: 'CO',
    country: 'United States',
    countryCode: 'US',
    lat: 39.8561,
    lng: -104.6737,
    searchPriority: 1,
  },
  {
    id: 'las-airport',
    type: 'airport',
    code: 'LAS',
    name: 'Harry Reid International Airport',
    city: 'Las Vegas',
    state: 'NV',
    country: 'United States',
    countryCode: 'US',
    lat: 36.0840,
    lng: -115.1537,
    searchPriority: 1,
  },
  {
    id: 'phx-airport',
    type: 'airport',
    code: 'PHX',
    name: 'Phoenix Sky Harbor International Airport',
    city: 'Phoenix',
    state: 'AZ',
    country: 'United States',
    countryCode: 'US',
    lat: 33.4352,
    lng: -112.0101,
    searchPriority: 2,
  },
  {
    id: 'mco-airport',
    type: 'airport',
    code: 'MCO',
    name: 'Orlando International Airport',
    city: 'Orlando',
    state: 'FL',
    country: 'United States',
    countryCode: 'US',
    lat: 28.4312,
    lng: -81.3081,
    searchPriority: 1,
  },
  {
    id: 'san-airport',
    type: 'airport',
    code: 'SAN',
    name: 'San Diego International Airport',
    city: 'San Diego',
    state: 'CA',
    country: 'United States',
    countryCode: 'US',
    lat: 32.7338,
    lng: -117.1933,
    searchPriority: 2,
  },
  {
    id: 'pdx-airport',
    type: 'airport',
    code: 'PDX',
    name: 'Portland International Airport',
    city: 'Portland',
    state: 'OR',
    country: 'United States',
    countryCode: 'US',
    lat: 45.5898,
    lng: -122.5951,
    searchPriority: 2,
  },
  {
    id: 'iad-airport',
    type: 'airport',
    code: 'IAD',
    name: 'Washington Dulles International Airport',
    city: 'Washington',
    state: 'DC',
    country: 'United States',
    countryCode: 'US',
    lat: 38.9531,
    lng: -77.4565,
    searchPriority: 1,
  },
  {
    id: 'dca-airport',
    type: 'airport',
    code: 'DCA',
    name: 'Ronald Reagan Washington National Airport',
    city: 'Washington',
    state: 'DC',
    country: 'United States',
    countryCode: 'US',
    lat: 38.8512,
    lng: -77.0402,
    searchPriority: 2,
  },

  // ============ MAJOR INTERNATIONAL AIRPORTS ============
  {
    id: 'lhr-airport',
    type: 'airport',
    code: 'LHR',
    name: 'London Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    lat: 51.4700,
    lng: -0.4543,
    searchPriority: 1,
  },
  {
    id: 'cdg-airport',
    type: 'airport',
    code: 'CDG',
    name: 'Charles de Gaulle Airport',
    city: 'Paris',
    country: 'France',
    countryCode: 'FR',
    lat: 49.0097,
    lng: 2.5479,
    searchPriority: 1,
  },
  {
    id: 'fra-airport',
    type: 'airport',
    code: 'FRA',
    name: 'Frankfurt Airport',
    city: 'Frankfurt',
    country: 'Germany',
    countryCode: 'DE',
    lat: 50.0379,
    lng: 8.5622,
    searchPriority: 1,
  },
  {
    id: 'ams-airport',
    type: 'airport',
    code: 'AMS',
    name: 'Amsterdam Airport Schiphol',
    city: 'Amsterdam',
    country: 'Netherlands',
    countryCode: 'NL',
    lat: 52.3105,
    lng: 4.7683,
    searchPriority: 1,
  },
  {
    id: 'nrt-airport',
    type: 'airport',
    code: 'NRT',
    name: 'Narita International Airport',
    city: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    lat: 35.7647,
    lng: 140.3864,
    searchPriority: 1,
  },
  {
    id: 'hnd-airport',
    type: 'airport',
    code: 'HND',
    name: 'Tokyo Haneda Airport',
    city: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    lat: 35.5494,
    lng: 139.7798,
    searchPriority: 2,
  },
  {
    id: 'dxb-airport',
    type: 'airport',
    code: 'DXB',
    name: 'Dubai International Airport',
    city: 'Dubai',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    lat: 25.2532,
    lng: 55.3657,
    searchPriority: 1,
  },
  {
    id: 'sin-airport',
    type: 'airport',
    code: 'SIN',
    name: 'Singapore Changi Airport',
    city: 'Singapore',
    country: 'Singapore',
    countryCode: 'SG',
    lat: 1.3644,
    lng: 103.9915,
    searchPriority: 1,
  },
  {
    id: 'hkg-airport',
    type: 'airport',
    code: 'HKG',
    name: 'Hong Kong International Airport',
    city: 'Hong Kong',
    country: 'Hong Kong',
    countryCode: 'HK',
    lat: 22.3080,
    lng: 113.9185,
    searchPriority: 1,
  },
  {
    id: 'syd-airport',
    type: 'airport',
    code: 'SYD',
    name: 'Sydney Kingsford Smith Airport',
    city: 'Sydney',
    country: 'Australia',
    countryCode: 'AU',
    lat: -33.9399,
    lng: 151.1753,
    searchPriority: 1,
  },
  {
    id: 'yyz-airport',
    type: 'airport',
    code: 'YYZ',
    name: 'Toronto Pearson International Airport',
    city: 'Toronto',
    country: 'Canada',
    countryCode: 'CA',
    lat: 43.6777,
    lng: -79.6248,
    searchPriority: 1,
  },
  {
    id: 'yvr-airport',
    type: 'airport',
    code: 'YVR',
    name: 'Vancouver International Airport',
    city: 'Vancouver',
    country: 'Canada',
    countryCode: 'CA',
    lat: 49.1967,
    lng: -123.1815,
    searchPriority: 2,
  },
  {
    id: 'mex-airport',
    type: 'airport',
    code: 'MEX',
    name: 'Mexico City International Airport',
    city: 'Mexico City',
    country: 'Mexico',
    countryCode: 'MX',
    lat: 19.4363,
    lng: -99.0721,
    searchPriority: 1,
  },
  {
    id: 'cun-airport',
    type: 'airport',
    code: 'CUN',
    name: 'Cancun International Airport',
    city: 'Cancun',
    country: 'Mexico',
    countryCode: 'MX',
    lat: 21.0365,
    lng: -86.8763,
    searchPriority: 1,
  },

  // ============ MAJOR CITIES (for city-based search) ============
  {
    id: 'nyc-city',
    type: 'city',
    code: 'NYC',
    name: 'New York City',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    countryCode: 'US',
    lat: 40.7128,
    lng: -74.0060,
    searchPriority: 1,
  },
  {
    id: 'la-city',
    type: 'city',
    code: 'LAX',
    name: 'Los Angeles',
    city: 'Los Angeles',
    state: 'CA',
    country: 'United States',
    countryCode: 'US',
    lat: 34.0522,
    lng: -118.2437,
    searchPriority: 1,
  },
  {
    id: 'chicago-city',
    type: 'city',
    code: 'CHI',
    name: 'Chicago',
    city: 'Chicago',
    state: 'IL',
    country: 'United States',
    countryCode: 'US',
    lat: 41.8781,
    lng: -87.6298,
    searchPriority: 1,
  },
  {
    id: 'miami-city',
    type: 'city',
    code: 'MIA',
    name: 'Miami',
    city: 'Miami',
    state: 'FL',
    country: 'United States',
    countryCode: 'US',
    lat: 25.7617,
    lng: -80.1918,
    searchPriority: 1,
  },
  {
    id: 'sf-city',
    type: 'city',
    code: 'SFO',
    name: 'San Francisco',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    countryCode: 'US',
    lat: 37.7749,
    lng: -122.4194,
    searchPriority: 1,
  },
  {
    id: 'london-city',
    type: 'city',
    code: 'LON',
    name: 'London',
    city: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    lat: 51.5074,
    lng: -0.1278,
    searchPriority: 1,
  },
  {
    id: 'paris-city',
    type: 'city',
    code: 'PAR',
    name: 'Paris',
    city: 'Paris',
    country: 'France',
    countryCode: 'FR',
    lat: 48.8566,
    lng: 2.3522,
    searchPriority: 1,
  },
  {
    id: 'tokyo-city',
    type: 'city',
    code: 'TYO',
    name: 'Tokyo',
    city: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    lat: 35.6762,
    lng: 139.6503,
    searchPriority: 1,
  },
  {
    id: 'dubai-city',
    type: 'city',
    code: 'DXB',
    name: 'Dubai',
    city: 'Dubai',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    lat: 25.2048,
    lng: 55.2708,
    searchPriority: 1,
  },
  {
    id: 'las-vegas-city',
    type: 'city',
    code: 'LAS',
    name: 'Las Vegas',
    city: 'Las Vegas',
    state: 'NV',
    country: 'United States',
    countryCode: 'US',
    lat: 36.1699,
    lng: -115.1398,
    searchPriority: 1,
  },
];

/**
 * Search locations by query string
 * Returns up to 3 results per category (airports, cities, hotels)
 */
export function searchLocations(query: string): {
  airports: Location[];
  cities: Location[];
  hotels: Location[];
} {
  if (!query || query.length < 2) {
    return { airports: [], cities: [], hotels: [] };
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Score-based fuzzy matching
  const scoredResults = LOCATIONS.map((location) => {
    let score = 0;

    // Exact code match (highest priority)
    if (location.code.toLowerCase() === normalizedQuery) {
      score += 1000;
    } else if (location.code.toLowerCase().startsWith(normalizedQuery)) {
      score += 500;
    }

    // City name match
    if (location.city.toLowerCase() === normalizedQuery) {
      score += 800;
    } else if (location.city.toLowerCase().startsWith(normalizedQuery)) {
      score += 400;
    } else if (location.city.toLowerCase().includes(normalizedQuery)) {
      score += 200;
    }

    // Location name match
    if (location.name.toLowerCase().includes(normalizedQuery)) {
      score += 100;
    }

    // Country match (lower priority)
    if (location.country.toLowerCase().includes(normalizedQuery)) {
      score += 50;
    }

    // Search priority boost
    score += (6 - (location.searchPriority || 3)) * 10;

    return { location, score };
  }).filter((result) => result.score > 0);

  // Sort by score descending
  scoredResults.sort((a, b) => b.score - a.score);

  // Split into categories and take top 3 of each
  const airports = scoredResults
    .filter((r) => r.location.type === 'airport')
    .slice(0, 3)
    .map((r) => r.location);

  const cities = scoredResults
    .filter((r) => r.location.type === 'city')
    .slice(0, 3)
    .map((r) => r.location);

  const hotels = scoredResults
    .filter((r) => r.location.type === 'hotel')
    .slice(0, 3)
    .map((r) => r.location);

  return { airports, cities, hotels };
}
