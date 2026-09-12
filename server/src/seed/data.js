const bcrypt = require('bcryptjs');
const User = require('../models/User');
const EmergencyService = require('../models/EmergencyService');
const EmergencyContact = require('../models/EmergencyContact');

const CENTER = { lat: 12.9716, lng: 77.5946 };

function offset(lat, lng, dLat, dLng) {
  return { lat: lat + dLat, lng: lng + dLng };
}

const services = [
  {
    name: 'City Care Multispecialty Hospital',
    type: 'hospital',
    address: 'MG Road, Bengaluru',
    phone: '+91-80-4000-1100',
    location: offset(CENTER.lat, CENTER.lng, 0.012, 0.008),
    availability: 'open',
    rating: 4.6,
    facilities: ['Emergency', 'ICU', 'Trauma', 'Ambulance bay'],
    emergencyDept: true,
    description: '24/7 emergency department with trauma care.',
  },
  {
    name: 'Greenfield General Hospital',
    type: 'hospital',
    address: 'Indiranagar, Bengaluru',
    phone: '+91-80-4000-2200',
    location: offset(CENTER.lat, CENTER.lng, 0.02, -0.015),
    availability: 'open',
    rating: 4.4,
    facilities: ['Emergency', 'Cardiology', 'Radiology'],
    emergencyDept: true,
  },
  {
    name: 'Rapid Response Ambulance Unit',
    type: 'ambulance',
    address: 'Central Dispatch, Bengaluru',
    phone: '+91-80-4000-1080',
    location: offset(CENTER.lat, CENTER.lng, 0.005, 0.003),
    availability: 'open',
    rating: 4.7,
    facilities: ['ALS', 'BLS', 'Oxygen'],
  },
  {
    name: 'Metro Lifeline Ambulance',
    type: 'ambulance',
    address: 'Koramangala Hub',
    phone: '+91-80-4000-1081',
    location: offset(CENTER.lat, CENTER.lng, -0.018, 0.01),
    availability: 'open',
    rating: 4.3,
    facilities: ['ICU ambulance'],
  },
  {
    name: 'Central Police Station',
    type: 'police',
    address: 'Cubbon Park Road, Bengaluru',
    phone: '100',
    location: offset(CENTER.lat, CENTER.lng, 0.008, -0.004),
    availability: 'open',
    rating: 4.1,
    facilities: ['24/7 desk', 'PCR vans'],
  },
  {
    name: 'East Zone Police Station',
    type: 'police',
    address: 'Old Airport Road',
    phone: '+91-80-2294-2500',
    location: offset(CENTER.lat, CENTER.lng, 0.025, 0.02),
    availability: 'open',
    rating: 4.0,
  },
  {
    name: 'Fire Station Brigade Road',
    type: 'fire',
    address: 'Brigade Road, Bengaluru',
    phone: '101',
    location: offset(CENTER.lat, CENTER.lng, -0.01, 0.006),
    availability: 'open',
    rating: 4.5,
    facilities: ['Fire engines', 'Rescue unit'],
  },
  {
    name: 'North Fire & Rescue',
    type: 'fire',
    address: 'Hebbal Main Road',
    phone: '+91-80-2297-1101',
    location: offset(CENTER.lat, CENTER.lng, 0.03, -0.01),
    availability: 'open',
    rating: 4.2,
  },
  {
    name: 'MedPlus Pharmacy 24x7',
    type: 'pharmacy',
    address: 'Church Street',
    phone: '+91-80-4000-3300',
    location: offset(CENTER.lat, CENTER.lng, 0.004, 0.002),
    availability: 'open',
    rating: 4.3,
    facilities: ['OTC', 'First aid', 'Prescription'],
  },
  {
    name: 'Apollo Pharmacy',
    type: 'pharmacy',
    address: 'Jayanagar 4th Block',
    phone: '+91-80-4000-3301',
    location: offset(CENTER.lat, CENTER.lng, -0.022, -0.012),
    availability: 'open',
    rating: 4.4,
  },
  {
    name: 'NightCare Clinic (Closed Demo)',
    type: 'hospital',
    address: 'Whitefield Outer Ring',
    phone: '+91-80-4000-4400',
    location: offset(CENTER.lat, CENTER.lng, 0.04, 0.035),
    availability: 'closed',
    rating: 3.9,
    emergencyDept: false,
  },
];

async function seedDatabase({ reset = false } = {}) {
  const count = await EmergencyService.countDocuments();
  if (count > 0 && !reset) {
    return { seeded: false, reason: 'already-populated' };
  }

  if (reset) {
    await EmergencyService.deleteMany({});
    await EmergencyContact.deleteMany({});
    await User.deleteMany({ email: 'demo@ailea.app' });
  }

  const docs = services.map((s) => ({
    ...s,
    location: {
      type: 'Point',
      coordinates: [s.location.lng, s.location.lat],
    },
  }));

  await EmergencyService.insertMany(docs);

  const passwordHash = await bcrypt.hash('demo1234', 10);
  const user = await User.create({
    name: 'Demo User',
    email: 'demo@ailea.app',
    phone: '+91-98765-43210',
    passwordHash,
    location: {
      lat: CENTER.lat,
      lng: CENTER.lng,
      label: 'Bengaluru City Center',
      updatedAt: new Date(),
    },
  });

  await EmergencyContact.insertMany([
    {
      userId: user._id,
      name: 'Priya (Sister)',
      phone: '+91-98765-11111',
      relationship: 'Family',
      priority: 1,
      notifyOnSos: true,
    },
    {
      userId: user._id,
      name: 'Arun (Friend)',
      phone: '+91-98765-22222',
      relationship: 'Friend',
      priority: 2,
      notifyOnSos: true,
    },
  ]);

  return { seeded: true, services: docs.length };
}

module.exports = { seedDatabase, CENTER };
