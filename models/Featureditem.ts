// models/FeaturedItem.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IFeaturedItem extends Document {
  menuItem: mongoose.Types.ObjectId;
  title: string;
  description: string;
  isActive: boolean;
  order: number;
  startDate?: Date;
  endDate?: Date;
  badgeText?: string;
  badgeColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeaturedItemSchema: Schema = new Schema({
  menuItem: {
    type: Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: [true, 'Menu item is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0,
    min: [0, 'Order cannot be negative']
  },
  startDate: {
    type: Date,
    default: Date.now,
    validate: {
      validator: function(this: IFeaturedItem, value: Date) {
        if (!this.endDate) return true;
        return value <= this.endDate;
      },
      message: 'Start date must be before end date'
    }
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(this: IFeaturedItem, value: Date) {
        if (!this.startDate) return true;
        return value >= this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  badgeText: {
    type: String,
    default: 'Featured',
    maxlength: [20, 'Badge text cannot be more than 20 characters']
  },
  badgeColor: {
    type: String,
    default: 'orange',
    enum: {
      values: ['orange', 'red', 'green', 'blue', 'purple', 'yellow'],
      message: 'Invalid badge color'
    }
  }
}, {
  timestamps: true
});

// Index for active featured items with date range
FeaturedItemSchema.index({ 
  isActive: 1, 
  order: 1,
  startDate: 1,
  endDate: 1 
});

// Virtual for checking if featured item is currently active
FeaturedItemSchema.virtual('isCurrentlyActive').get(function() {
  if (!this.isActive) return false;
  
  const now = new Date();
  if (this.startDate && this.startDate > now) return false;
  if (this.endDate && this.endDate < now) return false;
  
  return true;
});

// Pre-save hook to validate menu item exists and is available
FeaturedItemSchema.pre('save', async function(next) {
  try {
    const menuItem = await mongoose.model('MenuItem').findById(this.menuItem);
    if (!menuItem) {
      throw new Error('Referenced menu item does not exist');
    }
    if (!menuItem.isAvailable) {
      throw new Error('Cannot feature an unavailable menu item');
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

export default mongoose.models.FeaturedItem || mongoose.model<IFeaturedItem>('FeaturedItem', FeaturedItemSchema);