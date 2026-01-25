// app/api/reservations/[id]/route.ts - COMPLETE FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Reservation from '../../../../models/reservation';

// Type for route parameters
type RouteParams = {
  params: Promise<{ id: string }>
};

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();
    
    // Await params in Next.js 14
    const { id } = await params;
    console.log('🔍 Updating reservation ID:', id);
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Reservation ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    console.log('📝 Update request body:', body);
    
    if (!body.status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }
    
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    // Find and update reservation
    const updatedReservation = await Reservation.findByIdAndUpdate(
      id,
      { status: body.status },
      { new: true, runValidators: true }
    ).select('-__v').lean();
    
    console.log('🔍 Search result for ID:', id, 'Found:', !!updatedReservation);
    
    if (!updatedReservation) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Reservation updated:', {
        //@ts-ignore
      id: updatedReservation._id,
        //@ts-ignore

      code: updatedReservation.reservationCode,
        //@ts-ignore

      newStatus: updatedReservation.status
    });
    
    return NextResponse.json({
      success: true,
      message: 'Reservation status updated successfully',
      reservation: updatedReservation
    });
    
  } catch (error: any) {
    console.error('❌ Update reservation error:', error);
    
    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: 'Invalid reservation ID format' },
        { status: 400 }
      );
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: errors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update reservation',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();
    
    const { id } = await params;
    console.log('🔍 Fetching reservation ID:', id);
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Reservation ID is required' },
        { status: 400 }
      );
    }
    
    const reservation = await Reservation.findById(id).select('-__v').lean();
    
    if (!reservation) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      reservation
    });
    
  } catch (error: any) {
    console.error('Get reservation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch reservation',
        details: error.message 
      },
      { status: 500 }
    );
  }
}