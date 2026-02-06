// models/Payment.ts - UPDATED
import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentPlatform {
  XPAY = 'xpay',
  PAYPRO = 'paypro',
  PAYFAST = 'payfast',
  JAZZCASH = 'jazzcash',
  EASYPAISA = 'easypaisa',
  STRIPE = 'stripe', // For future use if Stripe becomes available
  OTHER = 'other'
}

export interface IPaymentMethod {
  id: string;
  platform: PaymentPlatform; // Which platform this payment method belongs to
  platformPaymentMethodId?: string; // ID from the payment platform (XPay, etc.)
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  cardholderName: string;
  isDefault: boolean;
  metadata?: {
    // Platform-specific metadata
    xpayToken?: string;
    payproToken?: string;
    stripePaymentMethodId?: string;
    [key: string]: any;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  paymentMethods: IPaymentMethod[];
  defaultPaymentMethod?: string; // ID of default payment method
  activePlatform: PaymentPlatform; // Currently active platform for new payments
  platforms: {
    // Platform-specific configurations
    [PaymentPlatform.XPAY]?: {
      merchantId?: string;
      apiKey?: string;
      isConfigured: boolean;
    };
    [PaymentPlatform.PAYPRO]?: {
      merchantId?: string;
      apiKey?: string;
      isConfigured: boolean;
    };
    [PaymentPlatform.PAYFAST]?: {
      merchantId?: string;
      apiKey?: string;
      isConfigured: boolean;
    };
    [PaymentPlatform.JAZZCASH]?: {
      merchantId?: string;
      apiKey?: string;
      isConfigured: boolean;
    };
    [PaymentPlatform.EASYPAISA]?: {
      merchantId?: string;
      apiKey?: string;
      isConfigured: boolean;
    };
    [PaymentPlatform.STRIPE]?: {
      accountId?: string;
      apiKey?: string;
      isConfigured: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const PaymentMethodSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  platform: {
    type: String,
    enum: Object.values(PaymentPlatform),
    required: true,
    default: PaymentPlatform.XPAY
  },
  platformPaymentMethodId: {
    type: String
  },
  brand: {
    type: String,
    required: true,
    enum: ['Visa', 'Mastercard', 'American Express', 'Discover', 'Other']
  },
  last4: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 4
  },
  exp_month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  exp_year: {
    type: Number,
    required: true
  },
  cardholderName: {
    type: String,
    required: true,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const PaymentSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  paymentMethods: [PaymentMethodSchema],
  defaultPaymentMethod: {
    type: String
  },
  activePlatform: {
    type: String,
    enum: Object.values(PaymentPlatform),
    default: PaymentPlatform.XPAY
  },
  platforms: {
    xpay: {
      merchantId: String,
      apiKey: String,
      isConfigured: {
        type: Boolean,
        default: false
      }
    },
    paypro: {
      merchantId: String,
      apiKey: String,
      isConfigured: {
        type: Boolean,
        default: false
      }
    },
    payfast: {
      merchantId: String,
      apiKey: String,
      isConfigured: {
        type: Boolean,
        default: false
      }
    },
    jazzcash: {
      merchantId: String,
      apiKey: String,
      isConfigured: {
        type: Boolean,
        default: false
      }
    },
    easypaisa: {
      merchantId: String,
      apiKey: String,
      isConfigured: {
        type: Boolean,
        default: false
      }
    },
    stripe: {
      accountId: String,
      apiKey: String,
      isConfigured: {
        type: Boolean,
        default: false
      }
    }
  }
}, {
  timestamps: true
});

// Ensure only one default payment method
PaymentSchema.pre('save', function(next) {
  if (this.isModified('paymentMethods')) {
    //@ts-ignore
    const defaultMethods = this.paymentMethods.filter(pm => pm.isDefault);
    if (defaultMethods.length > 1) {
      // Set only the first one as default
      for (let i = 1; i < defaultMethods.length; i++) {
        defaultMethods[i].isDefault = false;
      }
    }
    
    // Update defaultPaymentMethod reference
    //@ts-ignore
    const defaultMethod = this.paymentMethods.find(pm => pm.isDefault);
    this.defaultPaymentMethod = defaultMethod ? defaultMethod.id : undefined;
  }
  next();
});

// Update timestamps on nested payment methods
PaymentSchema.pre('save', function(next) {
  if (this.isModified('paymentMethods')) {
    //@ts-ignore
    this.paymentMethods.forEach(pm => {
      if (pm.isModified) {
        pm.updatedAt = new Date();
      }
    });
  }
  next();
});

// Create and export the model
export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);