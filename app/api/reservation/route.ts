// app/api/reservations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Reservation from '../../../models/reservation';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'date', 'time', 'guests'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Check for existing reservation at same date/time
    const existingReservation = await Reservation.findOne({
      date: new Date(body.date),
      time: body.time,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingReservation) {
      return NextResponse.json(
        { error: 'This time slot is already booked. Please choose another time.' },
        { status: 400 }
      );
    }

    // Generate reservation code manually as fallback
    const reservationCode = `RES${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();

    const reservation = new Reservation({
      ...body,
      date: new Date(body.date),
      reservationCode // Explicitly set the code
    });

    await reservation.save();

    return NextResponse.json(
      { 
        message: 'Reservation submitted successfully', 
        reservation: {
          id: reservation._id,
          reservationCode: reservation.reservationCode,
          name: reservation.name,
          date: reservation.date,
          time: reservation.time,
          guests: reservation.guests,
          status: reservation.status
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Reservation error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }
    
    if (error.code === 11000) {
      // If duplicate reservation code, try again with a new code
      if (error.keyPattern?.reservationCode) {
        return NextResponse.json(
          { error: 'Please try submitting your reservation again.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    let query: any = {};
    
    if (date) {
      query.date = new Date(date);
    }
    
    const reservations = await Reservation.find(query)
      .sort({ date: 1, time: 1 })
      .select('-__v')
      .lean();

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error('Get reservations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}