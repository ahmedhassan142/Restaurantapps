// models/Category.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  image?: string;
  parent?: mongoose.Types.ObjectId;
  children: mongoose.Types.ObjectId[];
  isActive: boolean;
  order: number;
  level: number;
  path: string[];
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  fullPath: string; // Make it part of the interface
}

// Define the interface for the model with static methods
interface ICategoryModel extends Model<ICategory> {
  buildTree(categories: ICategory[], parentId?: string | null): any[];
}

const CategorySchema: Schema<ICategory> = new Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  image: {
    type: String,
    default: '/images/default-category.jpg'
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  children: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 0
  },
  path: {
    type: [String],
    default: []
  },
  slug: {
    type: String,
    unique: true,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Ensure path exists when converting to JSON
      if (!ret.path) {
        ret.path = [ret.name];
      }
      delete ret.id;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Ensure path exists when converting to object
      if (!ret.path) {
        ret.path = [ret.name];
      }
      return ret;
    }
  }
});

// Virtual for full category path - FIXED with better error handling
CategorySchema.virtual('fullPath').get(function(this: ICategory) {
  // Ensure path is always an array and has content
  if (Array.isArray(this.path) && this.path.length > 0) {
    return this.path.join(' > ');
  }
  
  // If path doesn't exist or is empty, return just the name
  return this.name || 'Unnamed Category';
});

// Generate slug before saving
CategorySchema.pre('save', async function(this: ICategory, next) {
  try {
    if (this.isModified('name')) {
      const baseSlug = this.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      
      // Ensure unique slug
      let slug = baseSlug;
      let counter = 1;
      
      const CategoryModel = mongoose.model<ICategory>('Category');
      
      while (await CategoryModel.findOne({ slug, _id: { $ne: this._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      this.slug = slug;
    }

    // Calculate level and path - ensure we always have a valid path
    if (this.parent) {
      const CategoryModel = mongoose.model<ICategory>('Category');
      const parent = await CategoryModel.findById(this.parent);
      
      if (parent) {
        this.level = parent.level + 1;
        // Ensure parent.path exists before spreading
        const parentPath = Array.isArray(parent.path) ? parent.path : [parent.name];
        this.path = [...parentPath, this.name];
      } else {
        this.level = 0;
        this.path = [this.name];
      }
    } else {
      this.level = 0;
      this.path = [this.name];
    }

    next();
  } catch (error) {
    console.error('Error in category pre-save hook:', error);
    next(error as Error);
  }
});

// Update children when parent changes
CategorySchema.post('save', async function(this: ICategory) {
  try {
    if (this.isModified('parent') || this.isModified('name')) {
      const CategoryModel = mongoose.model<ICategory>('Category');
      const children = await CategoryModel.find({ parent: this._id });
      
      const savePromises = children.map(child => child.save());
      await Promise.all(savePromises);
    }
  } catch (error) {
    console.error('Error updating children paths:', error);
  }
});

// Static method to build tree structure
CategorySchema.statics.buildTree = function(categories: ICategory[], parentId: string | null = null) {
  return categories
    .filter(category => {
      if (parentId === null) return !category.parent;
      return category.parent?.toString() === parentId;
    })
    .map(category => ({
      ...category.toObject(),
      //@ts-ignore
      children: this.buildTree(categories, category._id.toString())
    }))
    .sort((a, b) => a.order - b.order);
};

// Create and export the model
//@ts-ignore
const Category: ICategoryModel = mongoose.models.Category || 
  mongoose.model<ICategory, ICategoryModel>('Category', CategorySchema);

export default Category;