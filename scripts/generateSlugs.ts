import mongoose from 'mongoose';
import productModel from '../models/productModel';
import dotenv from 'dotenv';

dotenv.config();

// Helper function to generate slug
function generateSlug(productName: string): string {
  return productName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .slice(0, 100); // Limit to 100 characters
}

async function generateSlugsForAllProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/furniture');
    console.log('✓ Connected to MongoDB');

    // Find all products without slugs
    const productsWithoutSlugs = await productModel.find({ 
      $or: [
        { productSlug: { $exists: false } },
        { productSlug: null },
        { productSlug: '' }
      ]
    });

    console.log(`Found ${productsWithoutSlugs.length} products without slugs`);

    if (productsWithoutSlugs.length === 0) {
      console.log('✓ All products already have slugs');
      process.exit(0);
    }

    // Update each product with a slug
    let updated = 0;
    for (const product of productsWithoutSlugs) {
      const slug = generateSlug(product.productName);
      
      // Check if slug already exists
      let finalSlug = slug;
      let counter = 1;
      while (await productModel.findOne({ productSlug: finalSlug, _id: { $ne: product._id } })) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }

      await productModel.findByIdAndUpdate(product._id, { productSlug: finalSlug });
      console.log(`✓ Updated: ${product.productName} -> ${finalSlug}`);
      updated++;
    }

    console.log(`\n✓ Successfully updated ${updated} products with slugs`);
    
    // Show all products with their slugs
    const allProducts = await productModel.find({}).select('productName productSlug');
    console.log('\nAll products with slugs:');
    allProducts.forEach(p => {
      console.log(`  - ${p.productName}: ${p.productSlug}`);
    });

    process.exit(0);
  } catch (error: any) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

generateSlugsForAllProducts();
