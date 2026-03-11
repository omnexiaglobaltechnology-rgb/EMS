const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const roles = [
  'intern',
  'team_lead',
  'team_lead_intern',
  'manager',
  'manager_intern',
  'admin',
  'cto',
  'cfo',
  'coo',
  'ceo',
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    const hashedPassword = await bcrypt.hash('Password123', 10);

    for (const role of roles) {
      const email = `${role}@owms.com`;
      await User.create({
        email,
        name: role.replace(/_/g, ' ').toUpperCase(),
        role,
        password: hashedPassword,
        isEmailVerified: true,
        authProvider: 'local'
      });
      console.log(`Created user: ${email} (Password: Password123)`);
    }

    console.log('--- SEEDING COMPLETE ---');
    console.log('All roles created with password: Password123');
    console.log('Universal secret key: 321852');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedUsers();
