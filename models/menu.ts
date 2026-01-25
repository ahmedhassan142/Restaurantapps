// models/MenuItem.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItem extends Document {
  name: string;
  description: string;
  price: number;
  category: mongoose.Types.ObjectId;
  image: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSpicy: boolean;
  ingredients: string[];
  preparationTime: number;
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Menu item name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  image: {
    type: String,
    default: '/images/default-food.jpg'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  isGlutenFree: {
    type: Boolean,
    default: false
  },
  isSpicy: {
    type: Boolean,
    default: false
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  preparationTime: {
    type: Number,
    default: 20,
    min: [5, 'Preparation time must be at least 5 minutes']
  },
  nutritionalInfo: {
    calories: { type: Number, min: 0 },
    protein: { type: Number, min: 0 },
    carbs: { type: Number, min: 0 },
    fat: { type: Number, min: 0 }
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for better query performance
MenuItemSchema.index({ category: 1, isAvailable: 1 });
MenuItemSchema.index({ price: 1 });
MenuItemSchema.index({ tags: 1 });

// Virtual for dietary labels
MenuItemSchema.virtual('dietaryLabels').get(function() {
  const labels = [];
  if (this.isVegetarian) labels.push('Vegetarian');
  if (this.isVegan) labels.push('Vegan');
  if (this.isGlutenFree) labels.push('Gluten Free');
  if (this.isSpicy) labels.push('Spicy');
  return labels;
});

export default mongoose.models.MenuItem || mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);