import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Category from '../models/Category.model';

const sampleCategories = [
  {
    name: 'Sofas',
    slug: 'sofas',
    image: '',
    description: 'Premium seating solutions'
  },
  {
    name: 'Beds',
    slug: 'beds',
    image: '',
    description: 'Comfortable sleeping furniture'
  },
  {
    name: 'Dining',
    slug: 'dining',
    image: '',
    description: 'Dining sets and tables'
  },
  {
    name: 'Storage',
    slug: 'storage',
    image: '',
    description: 'Storage solutions'
  },
  {
    name: 'Office',
    slug: 'office',
    image: '',
    description: 'Office furniture'
  },
  {
    name: 'Decor',
    slug: 'decor',
    image: '',
    description: 'Home decor items'
  }
];

async function seedCategories() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('🗑️  Cleared existing categories');

    // Insert sample categories
    const inserted = await Category.insertMany(sampleCategories);
    console.log(`✅ Added ${inserted.length} categories`);
    
    inserted.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug})`);
    });

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
