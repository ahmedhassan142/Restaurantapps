// models/User.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'customer';
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
 resetPasswordToken: String;
  
  
  resetPasswordExpires: Date;
  
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  preferences?: {
    dietaryRestrictions?: string[];
    favoriteCategories?: mongoose.Types.ObjectId[];
  };
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateEmailVerificationToken(): Promise<string>;
  generatePasswordResetToken(): Promise<string>;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'customer'],
    default: 'customer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  resetPasswordToken: {
    type: String,
    default: undefined
  },
  
  resetPasswordExpires: {
    type: Date,
    default: undefined
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  preferences: {
    dietaryRestrictions: [String],
    favoriteCategories: [{
      type: Schema.Types.ObjectId,
      ref: 'Category'
    }]
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    //@ts-ignore
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token
UserSchema.methods.generateEmailVerificationToken = async function(): Promise<string> {
  // Generate token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and save to database
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // Set expiration (24 hours from now)
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  await this.save();
  
  return verificationToken;
};

// Generate password reset token
UserSchema.methods.generatePasswordResetToken = async function(): Promise<string> {
  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and save to database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expiration (1 hour from now)
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  
  await this.save();
  
  return resetToken;
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);