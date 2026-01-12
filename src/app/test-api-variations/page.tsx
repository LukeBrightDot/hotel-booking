'use client';

import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Loader2, Play, Download, CheckCircle, XCircle } from 'lucide-react';

interface TestVariation {
  id: number;
  searchMethod: 'GeoCode' | 'RefPoint';
  location: string;
  locationCode?: string;
  lat?: number;
  lng?: number;
  apiVersion: string;
  radius: number;
  withOptionalFields: boolean;
  status?: 'pending' | 'running' | 'success' | 'failed';
  responseTime?: number;
  hotelCount?: number;
  error?: string;
}

interface TestLocation {
  name: string;
  code: string;
  lat: number;
  lng: number;
}

const TEST_LOCATIONS: TestLocation[] = [
  { name: 'Miami', code: 'MIA', lat: 25.7959, lng: -80.2871 },
  { name: 'New York JFK', code: 'JFK', lat: 40.6413, lng: -73.7781 },
  { name: 'Los Angeles', code: 'LAX', lat: 33.9416, lng: -118.4085 },
  { name: 'Chicago', code: 'ORD', lat: 41.9742, lng: -87.9073 },
];

export default function TestAPIVariations() {
  const [variations, setVariations] = useState<TestVariation[]>([]);
  const [testing, setTesting] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [successful, setSuccessful] = useState(0);

  const generateTestMatrix = () => {
    const tests: TestVariation[] = [];
    let id = 0;

    const apiVersions = ['5.1.0', '4.1.0', '3.0.0'];
    const radiusOptions = [10, 20, 50];
    const optionalFieldOptions = [true, false];

    TEST_LOCATIONS.forEach((location) => {
      apiVersions.forEach((version) => {
        radiusOptions.forEach((radius) => {
          optionalFieldOptions.forEach((withOptional) => {
            // Test 1: RefPoint with CODE
            tests.push({
              id: id++,
              searchMethod: 'RefPoint',
              location: location.name,
              locationCode: location.code,
              apiVersion: version,
              radius,
              withOptionalFields: withOptional,
              status: 'pending',
            });

            // Test 2: GeoCode with coordinates
            tests.push({
              id: id++,
              searchMethod: 'GeoCode',
              location: location.name,
              lat: location.lat,
              lng: location.lng,
              apiVersion: version,
              radius,
              withOptionalFields: withOptional,
              status: 'pending',
            });
          });
        });
      });
    });

    setVariations(tests);
    setCompleted(0);
    setSuccessful(0);
  };

  const runTest = async (variation: TestVariation): Promise<TestVariation> => {
    const checkIn = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    const checkOut = format(addDays(new Date(), 9), 'yyyy-MM-dd');

    // Build payload based on search method
    let payload: any = {
      GetHotelAvailRQ: {
        version: variation.apiVersion,
        SearchCriteria: {
          GeoSearch: {
            GeoRef: {
              Radius: variation.radius,
              UOM: 'MI',
            },
          },
          RateInfoRef: {
            CurrencyCode: 'USD',
            StayDateTimeRange: {
              StartDate: `${checkIn}T00:00:00`,
              EndDate: `${checkOut}T00:00:00`,
            },
            Rooms: {
              Room: [{ Index: 1, Adults: 2 }],
            },
          },
        },
      },
    };

    // Add search-specific fields
    if (variation.searchMethod === 'GeoCode') {
      payload.GetHotelAvailRQ.SearchCriteria.GeoSearch.GeoRef.GeoCode = {
        Latitude: variation.lat,
        Longitude: variation.lng,
      };
    } else {
      payload.GetHotelAvailRQ.SearchCriteria.GeoSearch.GeoRef.RefPoint = {
        Value: variation.locationCode,
        ValueContext: 'CODE',
        RefPointType: '6',
      };
    }

    // Add optional fields if requested
    if (variation.withOptionalFields) {
      payload.GetHotelAvailRQ.SearchCriteria.RateInfoRef.BestOnly = '1';
    }

    try {
      const start = performance.now();

      // Call Sabre API directly
      const baseUrl = process.env.NEXT_PUBLIC_SABRE_BASE_URL || 'https://api.sabre.com';

      // Get auth token first
      const authResponse = await fetch('/api/auth/token');
      if (!authResponse.ok) {
        throw new Error('Authentication failed');
      }
      const { token } = await authResponse.json();

      const response = await fetch(`${baseUrl}/v5/get/hotelavail`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
        },
        body: JSON.stringify(payload),
      });

      const responseTime = performance.now() - start;
      const data = await response.json();

      if (response.ok) {
        const hotels = data?.GetHotelAvailRS?.HotelAvailInfos?.HotelAvailInfo || [];
        return {
          ...variation,
          status: 'success',
          responseTime,
          hotelCount: Array.isArray(hotels) ? hotels.length : 0,
        };
      } else {
        return {
          ...variation,
          status: 'failed',
          responseTime,
          error: data.message || `HTTP ${response.status}`,
        };
      }
    } catch (err) {
      return {
        ...variation,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setCompleted(0);
    setSuccessful(0);

    const results: TestVariation[] = [];

    for (const variation of variations) {
      // Update status to running
      setVariations((prev) =>
        prev.map((v) => (v.id === variation.id ? { ...v, status: 'running' } : v))
      );

      const result = await runTest(variation);
      results.push(result);

      // Update with result
      setVariations((prev) =>
        prev.map((v) => (v.id === result.id ? result : v))
      );

      setCompleted((prev) => prev + 1);
      if (result.status === 'success') {
        setSuccessful((prev) => prev + 1);
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setTesting(false);
  };

  const exportResults = () => {
    const successfulTests = variations.filter((v) => v.status === 'success');
    const csv = [
      ['Method', 'Location', 'Version', 'Radius', 'Optional Fields', 'Response Time', 'Hotels Found'].join(','),
      ...successfulTests.map((v) =>
        [
          v.searchMethod,
          v.location,
          v.apiVersion,
          v.radius,
          v.withOptionalFields,
          v.responseTime?.toFixed(0),
          v.hotelCount,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sabre-test-results-${Date.now()}.csv`;
    a.click();
  };

  const successRate = variations.length > 0 ? (successful / completed) * 100 : 0;
  const avgResponseTime = variations
    .filter((v) => v.status === 'success' && v.responseTime)
    .reduce((sum, v) => sum + (v.responseTime || 0), 0) / (successful || 1);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Sabre API Test Matrix</h1>
          <p className="text-gray-600">
            Systematically test GeoCode vs RefPoint with multiple configurations
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4">
            <button
              onClick={generateTestMatrix}
              disabled={testing}
              className="px-6 py-3 bg-[#1c5558] text-white font-semibold rounded-lg hover:bg-[#1c5558]/90 disabled:bg-gray-400 transition-all flex items-center gap-2"
            >
              Generate Test Matrix ({variations.length === 0 ? 'Click to Generate' : `${variations.length} tests`})
            </button>

            {variations.length > 0 && (
              <>
                <button
                  onClick={runAllTests}
                  disabled={testing}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all flex items-center gap-2"
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Running Tests... ({completed}/{variations.length})
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Run All Tests
                    </>
                  )}
                </button>

                <button
                  onClick={exportResults}
                  disabled={successful === 0}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all flex items-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  Export Results
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        {variations.length > 0 && (
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Total Tests</div>
              <div className="text-2xl font-bold">{variations.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Completed</div>
              <div className="text-2xl font-bold">
                {completed} / {variations.length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Success Rate</div>
              <div className="text-2xl font-bold text-green-600">{successRate.toFixed(1)}%</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Avg Response Time</div>
              <div className="text-2xl font-bold">{avgResponseTime.toFixed(0)}ms</div>
            </div>
          </div>
        )}

        {/* Results Table */}
        {variations.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Method</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Version</th>
                    <th className="px-4 py-3 text-left">Radius</th>
                    <th className="px-4 py-3 text-left">Optional</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Time (ms)</th>
                    <th className="px-4 py-3 text-left">Hotels</th>
                    <th className="px-4 py-3 text-left">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {variations.map((variation) => (
                    <tr
                      key={variation.id}
                      className={`border-t ${
                        variation.status === 'success'
                          ? 'bg-green-50'
                          : variation.status === 'failed'
                          ? 'bg-red-50'
                          : variation.status === 'running'
                          ? 'bg-blue-50'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-2">{variation.id}</td>
                      <td className="px-4 py-2 font-mono text-xs">{variation.searchMethod}</td>
                      <td className="px-4 py-2">{variation.location}</td>
                      <td className="px-4 py-2">{variation.apiVersion}</td>
                      <td className="px-4 py-2">{variation.radius} mi</td>
                      <td className="px-4 py-2">{variation.withOptionalFields ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-2">
                        {variation.status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {variation.status === 'failed' && <XCircle className="h-5 w-5 text-red-600" />}
                        {variation.status === 'running' && (
                          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                        )}
                        {variation.status === 'pending' && (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {variation.responseTime ? variation.responseTime.toFixed(0) : '-'}
                      </td>
                      <td className="px-4 py-2">{variation.hotelCount || '-'}</td>
                      <td className="px-4 py-2 text-xs text-red-600">
                        {variation.error ? variation.error.substring(0, 50) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Test Matrix Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Test Matrix Details</h4>
          <div className="text-sm space-y-1">
            <div>
              <strong>Locations:</strong> Miami (MIA), New York (JFK), Los Angeles (LAX), Chicago (ORD)
            </div>
            <div>
              <strong>API Versions:</strong> 5.1.0, 4.1.0, 3.0.0
            </div>
            <div>
              <strong>Search Methods:</strong> GeoCode (coordinates) vs RefPoint (airport codes)
            </div>
            <div>
              <strong>Radius Options:</strong> 10, 20, 50 miles
            </div>
            <div>
              <strong>Optional Fields:</strong> With/without BestOnly parameter
            </div>
            <div>
              <strong>Total Combinations:</strong> 4 locations × 3 versions × 2 methods × 3 radius × 2 optional = 144 tests
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
