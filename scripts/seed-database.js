// scripts/seed-admin-standalone.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedAdmin() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define User schema (same as your model)
    const UserSchema = new mongoose.Schema({
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
      },
      email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
      },
      password: {
        type: String,
        required: true,
        minlength: 6
      },
      role: {
        type: String,
        enum: ['admin', 'manager', 'staff'],
        default: 'staff'
      },
      isActive: {
        type: Boolean,
        default: true
      },
      lastLogin: {
        type: Date
      }
    }, {
      timestamps: true
    });

    const User = mongoose.model('User', UserSchema);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@epicurean.com' });
    
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists. Updating password...');
      // Hash the new password
      const hashedPassword = await bcrypt.hash('admin123', 12);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('✅ Admin password updated');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@epicurean.com',
        password: hashedPassword,
        role: 'admin'
      });

      await adminUser.save();
      console.log('✅ Admin user created');
    }

    console.log('\n🎉 Admin setup completed!');
    console.log('\n📧 Admin Credentials:');
    console.log('   Email: admin@epicurean.com');
    console.log('   Password: admin123');
    console.log('\n🚀 You can now login at: http://localhost:3000/login');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedAdmin();