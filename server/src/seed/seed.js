require('dotenv').config();
const { connectDB } = require('../config/db');
const { seedDatabase } = require('./data');

async function seed() {
  await connectDB();
  const result = await seedDatabase({ reset: true });
  console.log('Seed complete', result);
  console.log('Demo login: demo@ailea.app / demo1234');
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
