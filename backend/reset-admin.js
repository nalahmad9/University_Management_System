import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
dotenv.config()

import User from './src/models/User.js'

async function resetAdmin() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MONGO_URI is missing from your .env file')
    }

    await mongoose.connect(mongoUri)

    const adminEmail = 'admin@university.edu'
    const newPassword = 'Admin@123'
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const admin = await User.findOneAndUpdate(
      { email: adminEmail },
      { 
        $set: {
          firstName: 'System',
          lastName: 'Admin',
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          status: 'active'
        }
      },
      { upsert: true, new: true }
    )

    console.log('✅ Admin updated with full name:', admin.firstName, admin.lastName)
    process.exit(0)
  } catch (err) {
    console.error('❌ Error updating admin:', err.message)
    process.exit(1)
  }
}

resetAdmin()