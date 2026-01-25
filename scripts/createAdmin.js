// scripts/createAdmin.js (at root level of your restaurantapp folder)
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://ah770643:2H3IHP4cvAsXzhW8@cluster0.bdbqw.mongodb.net/Restaurant?retryWrites=true&w=majority&appName=Cluster0");
    console.log('MongoDB connected successfully');
    
    // Define User schema inline since we can't import the model directly
    const UserSchema = new mongoose.Schema({
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      password: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        enum: ['user', 'staff', 'manager', 'admin'],
        default: 'user',
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    });

    // Get or create User model
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const adminEmail = 'admin@epicurean.com';
    const adminPassword = 'admin123';
    
    // Check if admin exists
    console.log(`Checking if admin exists: ${adminEmail}`);
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin already exists, updating role and password...');
      
      // Update password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      existingAdmin.name = 'Admin User';
      
      await existingAdmin.save();
      console.log('Admin updated successfully');
    } else {
      // Create new admin
      console.log('Creating new admin user...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const admin = new User({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      
      await admin.save();
      console.log('Admin user created successfully');
    }
    
    console.log('\n====================================');
    console.log('ADMIN CREDENTIALS:');
    console.log('====================================');
    console.log('Email:    admin@epicurean.com');
    console.log('Password: admin123');
    console.log('Role:     admin');
    console.log('====================================\n');
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === 11000) {
      console.error('Duplicate email error. Admin might already exist.');
    }
  }
}

// Run the function
createAdmin();