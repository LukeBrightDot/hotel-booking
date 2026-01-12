'use client';

import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Loader2, Zap } from 'lucide-react';

interface TestResult {
  method: 'GeoCode' | 'RefPoint';
  location: string;
  latencyMs: number;
  hotelCount: number;
  error?: string;
}

interface TestLocation {
  name: string;
  code: string;
  lat: number;
  lng: number;
}

export default function TestSearchPerformance() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  // Test location
  const [selectedLocation, setSelectedLocation] = useState<TestLocation>({
    name: 'Miami',
    code: 'MIA',
    lat: 25.7959,
    lng: -80.2871,
  });

  const locations: TestLocation[] = [
    { name: 'Miami', code: 'MIA', lat: 25.7959, lng: -80.2871 },
    { name: 'New York JFK', code: 'JFK', lat: 40.6413, lng: -73.7781 },
    { name: 'Los Angeles', code: 'LAX', lat: 33.9416, lng: -118.4085 },
    { name: 'Chicago', code: 'ORD', lat: 41.9742, lng: -87.9073 },
  ];

  const runTest = async () => {
    setTesting(true);
    setResults([]);

    const checkIn = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    const checkOut = format(addDays(new Date(), 9), 'yyyy-MM-dd');

    const testResults: TestResult[] = [];

    // Test 1: RefPoint with CODE (airport code)
    try {
      const start1 = performance.now();
      const response1 = await fetch('/api/search/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: {
            type: 'airport',
            code: selectedLocation.code,
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
          },
          checkIn,
          checkOut,
          rooms: 1,
          adults: 2,
        }),
      });

      const data1 = await response1.json();
      const duration1 = performance.now() - start1;

      testResults.push({
        method: 'RefPoint',
        location: selectedLocation.name,
        latencyMs: duration1,
        hotelCount: data1.results?.length || 0,
        error: response1.ok ? undefined : data1.message,
      });
    } catch (err) {
      testResults.push({
        method: 'RefPoint',
        location: selectedLocation.name,
        latencyMs: 0,
        hotelCount: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }

    // Test 2: GeoCode with coordinates (lat/lng)
    try {
      const start2 = performance.now();
      const response2 = await fetch('/api/search/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: {
            type: 'hotel', // Force GeoCode by not being airport/city type
            code: '', // Empty code to force GeoCode path
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
          },
          checkIn,
          checkOut,
          rooms: 1,
          adults: 2,
        }),
      });

      const data2 = await response2.json();
      const duration2 = performance.now() - start2;

      testResults.push({
        method: 'GeoCode',
        location: selectedLocation.name,
        latencyMs: duration2,
        hotelCount: data2.results?.length || 0,
        error: response2.ok ? undefined : data2.message,
      });
    } catch (err) {
      testResults.push({
        method: 'GeoCode',
        location: selectedLocation.name,
        latencyMs: 0,
        hotelCount: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  const refPointResult = results.find(r => r.method === 'RefPoint');
  const geoCodeResult = results.find(r => r.method === 'GeoCode');
  const winner = refPointResult && geoCodeResult && !refPointResult.error && !geoCodeResult.error
    ? refPointResult.latencyMs < geoCodeResult.latencyMs ? 'RefPoint' : 'GeoCode'
    : null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">GeoCode vs RefPoint Performance Test</h1>
          <p className="text-gray-600">Compare GeoCode (coordinates) vs RefPoint (airport code) for the SAME location</p>
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Testing:</strong> This tests the CORRECTED implementation with GeoCode (Latitude/Longitude) vs RefPoint (CODE).
              Previous implementation incorrectly used RefPoint with ValueContext:"GEO" which doesn't exist!
            </p>
          </div>
        </div>

        {/* Test Parameters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Location to Test</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Location
            </label>
            <select
              value={selectedLocation.code}
              onChange={(e) => {
                const loc = locations.find(l => l.code === e.target.value);
                if (loc) setSelectedLocation(loc);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c5558]/30"
            >
              {locations.map(loc => (
                <option key={loc.code} value={loc.code}>
                  {loc.name} ({loc.code}) - {loc.lat}, {loc.lng}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">RefPoint (CODE) will use:</div>
              <code className="text-xs bg-white px-2 py-1 rounded border">
                RefPoint: &#123; Value: "{selectedLocation.code}", ValueContext: "CODE", RefPointType: "6" &#125;
              </code>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">GeoCode will use:</div>
              <code className="text-xs bg-white px-2 py-1 rounded border">
                GeoCode: &#123; Latitude: {selectedLocation.lat}, Longitude: {selectedLocation.lng} &#125;
              </code>
            </div>
          </div>

          <button
            onClick={runTest}
            disabled={testing}
            className="w-full py-3 px-6 bg-[#1c5558] text-white font-semibold rounded-lg hover:bg-[#1c5558]/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {testing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Run Performance Test
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* RefPoint Results */}
            <div className={`bg-white rounded-lg shadow-md p-6 ${winner === 'RefPoint' ? 'ring-2 ring-green-500' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">RefPoint (CODE)</h3>
                {winner === 'RefPoint' && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    Faster
                  </span>
                )}
              </div>

              {refPointResult?.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{refPointResult.error}</p>
                </div>
              ) : refPointResult ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Response Time</div>
                    <div className="text-3xl font-bold text-[#1c5558]">
                      {(refPointResult.latencyMs / 1000).toFixed(2)}s
                    </div>
                    <div className="text-sm text-gray-500">{refPointResult.latencyMs.toFixed(0)}ms</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Hotels Found</div>
                    <div className="text-2xl font-semibold">{refPointResult.hotelCount}</div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="text-sm text-gray-600">Request Type</div>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                      RefPoint &#123;<br/>
                      &nbsp;&nbsp;Value: "{selectedLocation.code}",<br/>
                      &nbsp;&nbsp;ValueContext: "CODE",<br/>
                      &nbsp;&nbsp;RefPointType: "6"<br/>
                      &#125;
                    </code>
                  </div>
                </div>
              ) : null}
            </div>

            {/* GeoCode Results */}
            <div className={`bg-white rounded-lg shadow-md p-6 ${winner === 'GeoCode' ? 'ring-2 ring-green-500' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">GeoCode (Coordinates)</h3>
                {winner === 'GeoCode' && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    Faster
                  </span>
                )}
              </div>

              {geoCodeResult?.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{geoCodeResult.error}</p>
                </div>
              ) : geoCodeResult ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Response Time</div>
                    <div className="text-3xl font-bold text-[#1c5558]">
                      {(geoCodeResult.latencyMs / 1000).toFixed(2)}s
                    </div>
                    <div className="text-sm text-gray-500">{geoCodeResult.latencyMs.toFixed(0)}ms</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Hotels Found</div>
                    <div className="text-2xl font-semibold">{geoCodeResult.hotelCount}</div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="text-sm text-gray-600">Request Type</div>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                      GeoCode &#123;<br/>
                      &nbsp;&nbsp;Latitude: {selectedLocation.lat},<br/>
                      &nbsp;&nbsp;Longitude: {selectedLocation.lng}<br/>
                      &#125;
                    </code>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Comparison Summary */}
        {refPointResult && geoCodeResult && !refPointResult.error && !geoCodeResult.error && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Performance Comparison for {selectedLocation.name}</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Time Difference</div>
                <div className="text-2xl font-bold">
                  {Math.abs(refPointResult.latencyMs - geoCodeResult.latencyMs).toFixed(0)}ms
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Faster Method</div>
                <div className="text-2xl font-bold text-green-600">
                  {winner}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Speed Improvement</div>
                <div className="text-2xl font-bold">
                  {winner === 'RefPoint'
                    ? ((geoCodeResult.latencyMs / refPointResult.latencyMs - 1) * 100).toFixed(1)
                    : ((refPointResult.latencyMs / geoCodeResult.latencyMs - 1) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold mb-2 text-green-800">✅ Implementation Fixed!</h4>
          <div className="text-sm space-y-1 text-green-900">
            <div><strong>Previous (BROKEN):</strong> Used RefPoint with ValueContext:"GEO" (doesn't exist!)</div>
            <div><strong>Current (CORRECT):</strong> Uses GeoCode object with Latitude/Longitude fields</div>
            <div className="mt-2 pt-2 border-t border-green-300">
              <strong>Test both methods:</strong> RefPoint works with airport codes, GeoCode works with coordinates.
              Both are now properly implemented!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
