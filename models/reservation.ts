// models/Reservation.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReservation extends Document {
  name: string;
  email: string;
  phone: string;
  date: Date;
  time: string;
  guests: number;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  tableNumber?: number;
  reservationCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
    enum: {
      values: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
      message: 'Invalid time slot'
    }
  },
  guests: {
    type: Number,
    required: [true, 'Number of guests is required'],
    min: [1, 'At least 1 guest is required'],
    max: [12, 'Maximum 12 guests per reservation']
  },
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  tableNumber: {
    type: Number,
    required: false
  },
  reservationCode: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return `RES${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
    }
  }
}, {
  timestamps: true
});

// Generate reservation code before saving - FIXED VERSION
ReservationSchema.pre('save', async function(next) {
  if (this.isNew && !this.reservationCode) {
    let codeGenerated = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!codeGenerated && attempts < maxAttempts) {
      try {
        // Generate a unique code using timestamp and random string
        const newCode = `RES${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
        
        // Check if code already exists
        const existing = await mongoose.model('Reservation').findOne({ reservationCode: newCode });
        
        if (!existing) {
          this.reservationCode = newCode;
          codeGenerated = true;
        }
        
        attempts++;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          // Fallback code if all attempts fail
          this.reservationCode = `RES${Date.now()}${Math.random().toString(36).substr(2, 3)}`.toUpperCase();
          codeGenerated = true;
        }
      }
    }
  }
  next();
});

export default mongoose.models.Reservation || mongoose.model<IReservation>('Reservation', ReservationSchema);