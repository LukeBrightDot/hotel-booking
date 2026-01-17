// Tool definitions for OpenAI Realtime API
// These define the functions the AI can call during conversation

export const assistantTools = [
  {
    type: 'function' as const,
    name: 'searchHotels',
    description: 'Search for available hotels based on destination, dates, and number of guests. Call this when you have gathered the destination, check-in date, check-out date, and number of guests from the user.',
    parameters: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          description: 'The city or location where the user wants to stay (e.g., "Miami", "New York", "Los Angeles")',
        },
        checkInDate: {
          type: 'string',
          description: 'Check-in date in YYYY-MM-DD format',
        },
        checkOutDate: {
          type: 'string',
          description: 'Check-out date in YYYY-MM-DD format',
        },
        guests: {
          type: 'number',
          description: 'Number of guests staying',
        },
        rooms: {
          type: 'number',
          description: 'Number of rooms needed (default 1)',
        },
        minPrice: {
          type: 'number',
          description: 'Minimum price per night in USD (optional). Use this when user specifies a price range like "around $200" (set to 180) or "under $300" (set to 0).',
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price per night in USD (optional). Use this when user specifies a price range like "around $200" (set to 220) or "under $300" (set to 300).',
        },
      },
      required: ['destination', 'checkInDate', 'checkOutDate', 'guests'],
    },
  },
  {
    type: 'function' as const,
    name: 'getHotelDetails',
    description: 'Get detailed information about a specific hotel including room types, amenities, and pricing. Call this when the user wants to know more about a particular hotel.',
    parameters: {
      type: 'object',
      properties: {
        hotelCode: {
          type: 'string',
          description: 'The unique hotel code from the search results',
        },
        hotelName: {
          type: 'string',
          description: 'The name of the hotel for reference',
        },
      },
      required: ['hotelCode'],
    },
  },
  {
    type: 'function' as const,
    name: 'selectHotel',
    description: 'Mark a hotel as selected for potential booking. Call this when the user indicates they want to book a specific hotel.',
    parameters: {
      type: 'object',
      properties: {
        hotelCode: {
          type: 'string',
          description: 'The unique hotel code of the selected hotel',
        },
        hotelName: {
          type: 'string',
          description: 'The name of the hotel',
        },
        roomType: {
          type: 'string',
          description: 'The selected room type if specified',
        },
        pricePerNight: {
          type: 'number',
          description: 'The price per night for the selected room',
        },
      },
      required: ['hotelCode', 'hotelName'],
    },
  },
];

// Type for tool call arguments
export interface SearchHotelsArgs {
  destination: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  rooms?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface GetHotelDetailsArgs {
  hotelCode: string;
  hotelName?: string;
}

export interface SelectHotelArgs {
  hotelCode: string;
  hotelName: string;
  roomType?: string;
  pricePerNight?: number;
}
