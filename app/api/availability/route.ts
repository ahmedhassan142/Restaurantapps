import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Reservation from '../../../models/reservation';

// Mock restaurant configuration - adjust these based on your restaurant
const RESTAURANT_CONFIG = {
  openingTime: '11:00', // 11:00 AM
  closingTime: '22:00', // 10:00 PM
  timeSlotInterval: 30, // minutes
  maxGuestsPerSlot: 20,
  tables: [
    { id: 1, capacity: 2 },
    { id: 2, capacity: 2 },
    { id: 3, capacity: 4 },
    { id: 4, capacity: 4 },
    { id: 5, capacity: 6 },
    { id: 6, capacity: 6 },
    { id: 7, capacity: 8 },
    { id: 8, capacity: 8 },
  ]
};

interface Availability {
  time: string;
  isAvailable: boolean;
  availableTables: number;
  remainingCapacity: number;
}

interface AvailabilityResponse {
  date: string;
  guests: number;
  availability: Availability[];
  allTimeSlots: string[];
}

// Generate time slots for the day
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  const [openHour, openMinute] = RESTAURANT_CONFIG.openingTime.split(':').map(Number);
  const [closeHour, closeMinute] = RESTAURANT_CONFIG.closingTime.split(':').map(Number);
  
  let currentHour = openHour;
  let currentMinute = openMinute;
  
  while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    slots.push(timeString);
    
    // Increment time
    currentMinute += RESTAURANT_CONFIG.timeSlotInterval;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }
  
  return slots;
}

// Calculate availability for a specific time slot
function calculateAvailability(
  reservations: any[],
  timeSlot: string,
  requestedGuests: number
): Availability {
  // Filter reservations for this time slot
  const slotReservations = reservations.filter(res => res.time === timeSlot);
  
  // Calculate remaining capacity
  let totalReservedGuests = slotReservations.reduce((sum, res) => sum + res.guests, 0);
  let remainingCapacity = RESTAURANT_CONFIG.maxGuestsPerSlot - totalReservedGuests;
  
  // Calculate available tables that can accommodate the requested guests
  const availableTables = RESTAURANT_CONFIG.tables.filter(table => {
    // Table must be large enough for the requested guests
    if (table.capacity < requestedGuests) return false;
    
    // Check if this table is already reserved
    const tableReservation = slotReservations.find(res => res.tableNumber === table.id);
    return !tableReservation;
  }).length;
  
  const isAvailable = remainingCapacity >= requestedGuests && availableTables > 0;
  
  return {
    time: timeSlot,
    isAvailable,
    availableTables,
    remainingCapacity
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const guests = parseInt(searchParams.get('guests') || '2');
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }
    
    if (isNaN(guests) || guests < 1 || guests > 20) {
      return NextResponse.json(
        { error: 'Invalid number of guests. Must be between 1 and 20.' },
        { status: 400 }
      );
    }
    
    // Parse the date and set to start of day
    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Fetch reservations for the specified date
    const reservations = await Reservation.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['pending', 'confirmed'] }
    }).select('time guests tableNumber').lean();
    
    // Generate all possible time slots
    const allTimeSlots = generateTimeSlots();
    
    // Calculate availability for each time slot
    const availability: Availability[] = allTimeSlots.map(timeSlot => 
      calculateAvailability(reservations, timeSlot, guests)
    );
    
    const response: AvailabilityResponse = {
      date,
      guests,
      availability,
      allTimeSlots
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}

// Optional: POST method to hold a time slot temporarily
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, time, guests, holdId } = body;
    
    if (!date || !time || !guests) {
      return NextResponse.json(
        { error: 'Date, time, and guests are required' },
        { status: 400 }
      );
    }
    
    // In a real application, you might want to implement a temporary hold system
    // to prevent double bookings during the reservation process
    
    return NextResponse.json({
      success: true,
      message: 'Time slot held temporarily',
      holdId: holdId || `hold_${Date.now()}`,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    });
    
  } catch (error) {
    console.error('Hold slot error:', error);
    return NextResponse.json(
      { error: 'Failed to hold time slot' },
      { status: 500 }
    );
  }
}