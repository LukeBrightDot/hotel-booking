import { NextRequest, NextResponse } from 'next/server';
import { createBooking, BookingRequest } from '@/lib/sabre/booking';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('\n🎯 ===== NEW BOOKING REQUEST =====');

    const body = await request.json();
    console.log('📋 Request body received');

    // Validate required fields
    const { context, guest, payment, specialRequests } = body as BookingRequest;

    if (!context) {
      return NextResponse.json(
        { success: false, error: 'Missing booking context' },
        { status: 400 }
      );
    }

    if (!guest) {
      return NextResponse.json(
        { success: false, error: 'Missing guest information' },
        { status: 400 }
      );
    }

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Missing payment information' },
        { status: 400 }
      );
    }

    // Validate context fields
    const requiredContextFields = [
      'hotelCode',
      'roomTypeCode',
      'rateCode',
      'checkIn',
      'checkOut',
      'adults',
      'rooms',
    ];

    for (const field of requiredContextFields) {
      if (!context[field as keyof typeof context]) {
        return NextResponse.json(
          { success: false, error: `Missing context field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate guest fields
    if (!guest.firstName || !guest.lastName || !guest.email) {
      return NextResponse.json(
        { success: false, error: 'Missing required guest fields (firstName, lastName, email)' },
        { status: 400 }
      );
    }

    // Validate payment fields
    if (!payment.cardholderName || !payment.cardNumber || !payment.cvv ||
        !payment.expirationMonth || !payment.expirationYear || !payment.cardType) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment fields' },
        { status: 400 }
      );
    }

    console.log('✅ Validation passed');
    console.log('Hotel:', context.hotelCode, '-', context.hotelName);
    console.log('Guest:', guest.firstName, guest.lastName);
    console.log('Dates:', context.checkIn, '→', context.checkOut);

    // Call Sabre booking API
    console.log('\n📞 Calling Sabre API...');
    const result = await createBooking({
      context,
      guest,
      payment,
      specialRequests,
    });

    if (!result.success) {
      console.error('❌ Booking failed:', result.error);

      // Save failed booking to database
      try {
        await prisma.booking.create({
          data: {
            hotelCode: context.hotelCode,
            hotelName: context.hotelName,
            roomTypeCode: context.roomTypeCode,
            roomTypeName: context.roomTypeName,
            rateCode: context.rateCode,
            checkIn: new Date(context.checkIn),
            checkOut: new Date(context.checkOut),
            nights: context.nights,
            guestFirstName: guest.firstName,
            guestLastName: guest.lastName,
            guestEmail: guest.email,
            guestPhone: guest.phone,
            totalAmount: context.amountAfterTax,
            currencyCode: context.currencyCode,
            status: 'failed',
            errorMessage: result.error,
            sabreRequest: result.rawRequest as any,
            sabreResponse: result.rawResponse as any,
            specialRequests,
          },
        });
        console.log('💾 Failed booking saved to database');
      } catch (dbError) {
        console.error('Database save error:', dbError);
      }

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          details: result.errorDetails,
        },
        { status: 400 }
      );
    }

    console.log('✅ Booking successful!');
    console.log('Confirmation:', result.confirmationNumber);
    console.log('Sabre Locator:', result.sabreLocator);
    console.log('Property Confirmation:', result.propertyConfirmation);

    // Save successful booking to database
    let bookingId: string;
    try {
      const booking = await prisma.booking.create({
        data: {
          confirmationNumber: result.confirmationNumber,
          sabreLocator: result.sabreLocator,
          propertyConfirmation: result.propertyConfirmation,
          hotelCode: context.hotelCode,
          hotelName: context.hotelName,
          roomTypeCode: context.roomTypeCode,
          roomTypeName: context.roomTypeName,
          rateCode: context.rateCode,
          checkIn: new Date(context.checkIn),
          checkOut: new Date(context.checkOut),
          nights: context.nights,
          guestFirstName: guest.firstName,
          guestLastName: guest.lastName,
          guestEmail: guest.email,
          guestPhone: guest.phone,
          totalAmount: result.totalAmount || context.amountAfterTax,
          currencyCode: result.currencyCode || context.currencyCode,
          priceBreakdown: {
            beforeTax: context.amountBeforeTax,
            afterTax: context.amountAfterTax,
          } as any,
          status: 'confirmed',
          sabreRequest: result.rawRequest as any,
          sabreResponse: result.rawResponse as any,
          specialRequests,
        },
      });

      bookingId = booking.id;
      console.log('💾 Booking saved to database:', bookingId);
    } catch (dbError) {
      console.error('❌ Database save error:', dbError);
      // Booking succeeded but database save failed
      return NextResponse.json({
        success: true,
        warning: 'Booking created but database save failed',
        booking: {
          confirmationNumber: result.confirmationNumber,
          sabreLocator: result.sabreLocator,
          propertyConfirmation: result.propertyConfirmation,
        },
      });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      booking: {
        id: bookingId!,
        confirmationNumber: result.confirmationNumber,
        sabreLocator: result.sabreLocator,
        propertyConfirmation: result.propertyConfirmation,
        hotel: {
          code: context.hotelCode,
          name: context.hotelName,
        },
        stay: {
          checkIn: context.checkIn,
          checkOut: context.checkOut,
          nights: context.nights,
        },
        room: {
          type: context.roomTypeName || context.roomTypeCode,
          rateCode: context.rateCode,
        },
        pricing: {
          totalAmount: result.totalAmount || context.amountAfterTax,
          currencyCode: result.currencyCode || context.currencyCode,
        },
        guest: {
          name: `${guest.firstName} ${guest.lastName}`,
          email: guest.email,
        },
      },
    });
  } catch (error) {
    console.error('❌ API endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
