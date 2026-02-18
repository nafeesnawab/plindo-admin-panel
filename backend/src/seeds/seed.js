import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Partner from '../models/Partner.model.js';
import Settings from '../models/Settings.model.js';
import Car from '../models/Car.model.js';

dotenv.config();

const CARS_DATA = [
  { make: 'Toyota', model: 'Corolla', bodyType: 'Sedan' },
  { make: 'Toyota', model: 'Yaris', bodyType: 'Hatchback' },
  { make: 'Toyota', model: 'RAV4', bodyType: 'SUV' },
  { make: 'Toyota', model: 'Hilux', bodyType: 'Pickup Truck' },
  { make: 'Honda', model: 'Civic', bodyType: 'Sedan' },
  { make: 'Honda', model: 'Jazz', bodyType: 'Hatchback' },
  { make: 'Honda', model: 'CR-V', bodyType: 'SUV' },
  { make: 'BMW', model: '3 Series', bodyType: 'Sedan' },
  { make: 'BMW', model: 'X5', bodyType: 'SUV' },
  { make: 'BMW', model: 'X3', bodyType: 'SUV' },
  { make: 'BMW', model: '1 Series', bodyType: 'Hatchback' },
  { make: 'Mercedes-Benz', model: 'C-Class', bodyType: 'Sedan' },
  { make: 'Mercedes-Benz', model: 'GLE', bodyType: 'SUV' },
  { make: 'Mercedes-Benz', model: 'A-Class', bodyType: 'Hatchback' },
  { make: 'Volkswagen', model: 'Golf', bodyType: 'Hatchback' },
  { make: 'Volkswagen', model: 'Tiguan', bodyType: 'SUV' },
  { make: 'Volkswagen', model: 'Passat', bodyType: 'Sedan' },
  { make: 'Volkswagen', model: 'Transporter', bodyType: 'Van' },
  { make: 'Audi', model: 'A4', bodyType: 'Sedan' },
  { make: 'Audi', model: 'Q5', bodyType: 'SUV' },
  { make: 'Audi', model: 'A3', bodyType: 'Hatchback' },
  { make: 'Nissan', model: 'Qashqai', bodyType: 'Crossover' },
  { make: 'Nissan', model: 'Juke', bodyType: 'Crossover' },
  { make: 'Nissan', model: 'X-Trail', bodyType: 'SUV' },
  { make: 'Ford', model: 'Focus', bodyType: 'Hatchback' },
  { make: 'Ford', model: 'Mustang', bodyType: 'Coupe' },
  { make: 'Ford', model: 'Ranger', bodyType: 'Pickup Truck' },
  { make: 'Porsche', model: '911', bodyType: 'Coupe' },
  { make: 'Porsche', model: 'Cayenne', bodyType: 'SUV' },
  { make: 'Range Rover', model: 'Sport', bodyType: 'SUV' },
  { make: 'Range Rover', model: 'Evoque', bodyType: 'SUV' },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Partner.deleteMany({}),
      Settings.deleteMany({}),
      Car.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create default admin
    const admin = await User.create({
      username: 'admin',
      email: 'admin@plindo.com',
      password: 'admin123',
      role: 'admin',
      avatar: '',
      isActive: true,
    });
    console.log(`👤 Admin created: ${admin.email} / admin123`);

    // Create demo partner
    const partner = await Partner.create({
      email: 'partner@plindo.com',
      password: 'partner123',
      businessName: 'Crystal Car Wash',
      businessLicenseNumber: 'BL-2024-001',
      contactPersonName: 'John Smith',
      phone: '+357 96 123 456',
      address: '123 Main Street, Limassol',
      latitude: 34.6786,
      longitude: 33.0413,
      location: 'Limassol, Cyprus',
      status: 'active',
      approvedAt: new Date(),
      description: 'Premium car wash and detailing services in Limassol. We provide top-quality service with attention to detail.',
      serviceRadius: 15,
      rating: 4.8,
      totalBookings: 156,
      completionRate: 98,
      totalEarnings: 12500,
      isVerified: true,
    });
    console.log(`🏢 Partner created: ${partner.email} / partner123`);

    // Create default platform settings
    const settings = await Settings.create({
      key: 'platform_settings',
      notificationTemplates: [
        { id: 'booking_confirmation', name: 'Booking Confirmation', subject: 'Your booking is confirmed', body: 'Hi {{customerName}}, your booking {{bookingNumber}} has been confirmed.', isActive: true },
        { id: 'booking_reminder', name: 'Booking Reminder', subject: 'Upcoming booking reminder', body: 'Hi {{customerName}}, your booking {{bookingNumber}} is scheduled for tomorrow.', isActive: true },
        { id: 'booking_cancelled', name: 'Booking Cancelled', subject: 'Booking cancelled', body: 'Hi {{customerName}}, your booking {{bookingNumber}} has been cancelled.', isActive: true },
        { id: 'partner_approved', name: 'Partner Approved', subject: 'Your application has been approved', body: 'Hi {{partnerName}}, your partner application has been approved! You can now log in.', isActive: true },
        { id: 'partner_rejected', name: 'Partner Rejected', subject: 'Application update', body: 'Hi {{partnerName}}, unfortunately your partner application was not approved. Reason: {{reason}}', isActive: true },
        { id: 'payout_processed', name: 'Payout Processed', subject: 'Payout processed', body: 'Hi {{partnerName}}, your payout of {{amount}} has been processed.', isActive: true },
      ],
    });
    console.log(`⚙️  Platform settings created (ID: ${settings._id})`);

    // Create cars
    await Car.insertMany(CARS_DATA);
    console.log(`🚗 ${CARS_DATA.length} car entries created`);

    console.log('\n✅ Seed completed successfully!');
    console.log('---');
    console.log('Admin:   admin@plindo.com / admin123');
    console.log('Partner: partner@plindo.com / partner123');
    console.log('---');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();
