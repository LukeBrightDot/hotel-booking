#!/usr/bin/env tsx

/**
 * Booking API Test Script
 *
 * This script tests the booking flow iteratively until it works.
 * Run with: npx tsx test/booking/test-booking.ts [scenario]
 *
 * Scenarios:
 * - minimal: Minimal required fields only
 * - full: Full booking with all optional fields
 * - loop: Run multiple tests in sequence
 */

import { BookingRequest } from '../../src/lib/sabre/booking';

// ============================================================================
// TEST CONFIGURATIONS
// ============================================================================

const TEST_CONFIGS = {
  // Minimal booking - only required fields
  minimal: {
    context: {
      hotelCode: '390915', // The Goodtime Hotel Miami Beach
      hotelName: 'The Goodtime Hotel Miami Beach',
      chainCode: 'TX',
      roomTypeCode: 'A1K', // Example room type - MUST come from actual search
      roomTypeName: 'Luminous Suite',
      rateCode: 'RAC', // Example rate code - MUST come from actual search
      checkIn: '2026-03-15',
      checkOut: '2026-03-18',
      nights: 3,
      adults: 2,
      children: 0,
      rooms: 1,
      amountBeforeTax: 600.00,
      amountAfterTax: 720.00,
      currencyCode: 'USD',
    },
    guest: {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith.test@example.com',
      phone: '+1-555-123-4567',
      address: {
        line1: '123 Main Street',
        city: 'New York',
        postalCode: '10001',
        country: 'US',
      },
    },
    payment: {
      cardholderName: 'John Smith',
      cardType: 'VISA' as const,
      cardNumber: '4111111111111111', // Test card
      expirationMonth: '12',
      expirationYear: '2025',
      cvv: '123',
      billingAddress: {
        line1: '123 Main Street',
        city: 'New York',
        postalCode: '10001',
        country: 'US',
      },
    },
  },

  // Full booking with all optional fields
  full: {
    context: {
      hotelCode: '390915',
      hotelName: 'The Goodtime Hotel Miami Beach A Tribute Portfolio Hotel',
      chainCode: 'TX',
      roomTypeCode: 'A1K',
      roomTypeName: 'Luminous Suite Offer',
      rateCode: 'RAC',
      checkIn: '2026-03-15',
      checkOut: '2026-03-18',
      nights: 3,
      adults: 2,
      children: 1,
      rooms: 1,
      amountBeforeTax: 600.00,
      amountAfterTax: 720.00,
      currencyCode: 'USD',
    },
    guest: {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith.fulltest@example.com',
      phone: '+1-555-987-6543',
      address: {
        line1: '456 Oak Avenue',
        city: 'Miami',
        postalCode: '33139',
        country: 'US',
      },
    },
    payment: {
      cardholderName: 'John M Smith',
      cardType: 'VISA' as const,
      cardNumber: '4111111111111111',
      expirationMonth: '06',
      expirationYear: '2027',
      cvv: '456',
      billingAddress: {
        line1: '789 Billing Street',
        city: 'Los Angeles',
        postalCode: '90001',
        country: 'US',
      },
    },
    specialRequests: 'Late check-in expected, high floor preferred',
  },
};

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testBooking(config: BookingRequest, testName: string) {
  console.log('\n' + '='.repeat(80));
  console.log(`🧪 TEST: ${testName}`);
  console.log('='.repeat(80));
  console.log('\n📋 Test Configuration:');
  console.log(`  Hotel: ${config.context.hotelName}`);
  console.log(`  Check-in: ${config.context.checkIn}`);
  console.log(`  Check-out: ${config.context.checkOut}`);
  console.log(`  Guest: ${config.guest.firstName} ${config.guest.lastName}`);
  console.log(`  Email: ${config.guest.email}`);
  console.log(`  Special Requests: ${config.specialRequests || 'None'}`);

  try {
    console.log('\n🚀 Sending booking request...');
    const response = await fetch('http://localhost:3000/api/booking/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    const data = await response.json();

    console.log(`\n📥 Response Status: ${response.status}`);
    console.log('Response Data:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ ===== TEST PASSED =====');
      console.log(`Confirmation Number: ${data.booking.confirmationNumber}`);
      console.log(`Sabre Locator: ${data.booking.sabreLocator}`);
      console.log(`Property Confirmation: ${data.booking.propertyConfirmation}`);
      return { success: true, data };
    } else {
      console.log('\n❌ ===== TEST FAILED =====');
      console.log(`Error: ${data.error}`);
      if (data.details) {
        console.log('Details:', JSON.stringify(data.details, null, 2));
      }
      return { success: false, error: data.error, details: data.details };
    }
  } catch (error) {
    console.log('\n❌ ===== TEST ERROR =====');
    console.error(error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================================
// LOOP TEST - Run multiple scenarios
// ============================================================================

async function runTestLoop(iterations: number = 3, delayMs: number = 2000) {
  console.log('\n🔄 Starting Test Loop');
  console.log(`Iterations: ${iterations}`);
  console.log(`Delay between tests: ${delayMs}ms\n`);

  const results: Array<{ test: string; success: boolean; error?: string }> = [];

  for (let i = 0; i < iterations; i++) {
    console.log(`\n\n${'#'.repeat(80)}`);
    console.log(`ITERATION ${i + 1}/${iterations}`);
    console.log(`${'#'.repeat(80)}\n`);

    // Test minimal config
    const minimalResult = await testBooking(TEST_CONFIGS.minimal, 'Minimal Booking');
    results.push({
      test: `Iteration ${i + 1} - Minimal`,
      success: minimalResult.success,
      error: minimalResult.error,
    });

    if (i < iterations - 1) {
      console.log(`\n⏳ Waiting ${delayMs}ms before next test...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Print summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%\n`);

  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.test}${result.error ? ` - ${result.error}` : ''}`);
  });

  console.log('\n' + '='.repeat(80) + '\n');

  // Exit with error code if any tests failed
  if (failed > 0) {
    process.exit(1);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const scenario = process.argv[2] || 'minimal';

  console.log('🏨 Hotel Booking API Test');
  console.log('========================\n');
  console.log(`Scenario: ${scenario}\n`);

  switch (scenario) {
    case 'minimal':
      await testBooking(TEST_CONFIGS.minimal, 'Minimal Booking Test');
      break;

    case 'full':
      await testBooking(TEST_CONFIGS.full, 'Full Booking Test');
      break;

    case 'loop':
      const iterations = parseInt(process.argv[3] || '3', 10);
      await runTestLoop(iterations);
      break;

    default:
      console.error(`Unknown scenario: ${scenario}`);
      console.log('Available scenarios: minimal, full, loop');
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
