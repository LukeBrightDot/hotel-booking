export type LocationType = 'airport' | 'city' | 'hotel';

export interface Location {
  id: string;
  type: LocationType;
  code: string; // Airport code (IATA) or city code
  name: string;
  city: string;
  state?: string; // For US locations
  country: string;
  countryCode: string; // ISO 2-letter code
  lat: number;
  lng: number;
  searchPriority?: number; // Higher = show first in results
}

export interface LocationSearchResult {
  airports: Location[];
  cities: Location[];
  hotels: Location[];
}
