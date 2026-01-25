// models/Order.ts - UPDATED
import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  menuItem: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: IOrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  type: 'pickup' | 'delivery';
  deliveryFee?: number;
  pickupTime?: Date;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  specialInstructions?: string;
  estimatedReadyTime?: Date;
  payment: {
    method: string;
    lastFour: string;
  };
  readyAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema: Schema = new Schema({
  menuItem: {
    type: Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  specialInstructions: {
    type: String,
    maxlength: 200
  }
});

const OrderSchema: Schema = new Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    default: 'TEMP' // Temporary default to avoid validation error
  },
  customer: {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    }
  },
  items: [OrderItemSchema],
  total: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['pickup', 'delivery'],
    required: true
  },
  pickupTime: {
    type: Date
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  specialInstructions: {
    type: String,
    maxlength: 500
  },
  estimatedReadyTime: {
    type: Date
  },
  payment: {
    method: {
      type: String,
      required: true,
      default: 'card'
    },
    lastFour: {
      type: String,
      required: true
    }
  },
  readyAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  adminNotes: {
    type: String
  }
}, {
  timestamps: true
});

// Generate order number before saving
OrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Get the latest order to generate sequential number
      const latestOrder = await mongoose.model('Order')
        .findOne({}, 'orderNumber')
        .sort({ createdAt: -1 })
        .exec();
      
      let nextNumber = 1;
      if (latestOrder && latestOrder.orderNumber) {
        // Extract number from orderNumber (e.g., "ORD0015" -> 15)
        const match = latestOrder.orderNumber.match(/\d+/);
        if (match) {
          nextNumber = parseInt(match[0]) + 1;
        }
      }
      
      // Format order number: ORD0001, ORD0002, etc.
      this.orderNumber = `ORD${nextNumber.toString().padStart(4, '0')}`;
      
      // Set estimated ready time (30 minutes from now for pickup, 45 for delivery)
      const readyMinutes = this.type === 'delivery' ? 45 : 30;
      this.estimatedReadyTime = new Date(Date.now() + readyMinutes * 60 * 1000);
      
      next();
    } catch (error: any) {
      next(error);
    }
  } else {
    next();
  }
});

// Calculate total before saving
OrderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    //@ts-ignore
    const itemsTotal = this.items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0);
    this.total = itemsTotal + (this.deliveryFee || 0);
  }
  next();
});

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);