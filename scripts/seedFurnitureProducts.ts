import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/Product';
import User from '../models/User';

type ProductCategory =
  | 'Sofas & Couches'
  | 'Chairs & Stools'
  | 'Beds & Mattresses'
  | 'Desks & Tables'
  | 'Storage & Cabinets'
  | 'Shelving & Units'
  | 'Outdoor Furniture'
  | 'Bedroom Furniture'
  | 'Dining Furniture'
  | 'Office Furniture';

type FolderMeta = {
  category: ProductCategory;
  titlePrefix: string;
  basePrice: number;
  baseDiscount: number;
  material: string;
  dimensions: string;
  colors: string[];
};

const CATEGORY_CONFIG: Record<string, FolderMeta> = {
  moderncontemporary: {
    category: 'Sofas & Couches',
    titlePrefix: 'Modern Contemporary Sofa',
    basePrice: 36000,
    baseDiscount: 12,
    material: 'Premium fabric and engineered wood',
    dimensions: '84 x 36 x 32 in',
    colors: ['Beige', 'Grey'],
  },
  seating: {
    category: 'Chairs & Stools',
    titlePrefix: 'Designer Seating Chair',
    basePrice: 12000,
    baseDiscount: 10,
    material: 'Solid wood and soft upholstery',
    dimensions: '28 x 30 x 34 in',
    colors: ['Walnut', 'Cream'],
  },
  sleeping: {
    category: 'Beds & Mattresses',
    titlePrefix: 'Comfort Sleeping Bed',
    basePrice: 32000,
    baseDiscount: 15,
    material: 'Solid sheesham wood',
    dimensions: '78 x 60 x 42 in',
    colors: ['Honey', 'Teak'],
  },
  storage: {
    category: 'Storage & Cabinets',
    titlePrefix: 'Smart Storage Cabinet',
    basePrice: 18000,
    baseDiscount: 8,
    material: 'Engineered wood with matte finish',
    dimensions: '48 x 16 x 72 in',
    colors: ['Oak', 'White'],
  },
  surfaces: {
    category: 'Desks & Tables',
    titlePrefix: 'Premium Surface Table',
    basePrice: 22000,
    baseDiscount: 11,
    material: 'Natural wood top and metal frame',
    dimensions: '48 x 24 x 30 in',
    colors: ['Natural', 'Brown'],
  },
};

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.bmp',
]);

const DEFAULT_DB_NAME = 'dandldb';
const DEFAULT_SEED_EMAIL = 'seed-admin@thewoodenspace.local';
const DEFAULT_SEED_NAME = 'Seed Admin';

function parseFlags() {
  const args = process.argv.slice(2);
  const hasFlag = (flag: string) => args.includes(flag);
  const readFlagValue = (flag: string): string | undefined => {
    const prefixed = args.find((arg) => arg.startsWith(`${flag}=`));
    if (prefixed) return prefixed.split('=').slice(1).join('=');
    const idx = args.findIndex((arg) => arg === flag);
    if (idx >= 0 && args[idx + 1]) return args[idx + 1];
    return undefined;
  };

  return {
    dryRun: hasFlag('--dry-run'),
    replaceExisting: hasFlag('--replace'),
    furnitureDir: readFlagValue('--furniture-dir'),
  };
}

function loadEnv() {
  dotenv.config();

  if (!process.env.MONGODB_URI || !process.env.CLOUDINARY_CLOUD_NAME) {
    const fallbackEnvPath = path.resolve(__dirname, '../DOC-20260204-WA0001.env');
    if (existsSync(fallbackEnvPath)) {
      dotenv.config({ path: fallbackEnvPath, override: false });
    }
  }
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toReadableName(folderName: string) {
  return folderName
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

function toReadableTitleFromFile(fileName: string) {
  const cleaned = fileName
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(download|image|images|img|oip|photo|pic|picture)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  return cleaned
    .split(' ')
    .map((word) => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .trim();
}

function detectFolderMeta(folderName: string): FolderMeta {
  const normalized = folderName.toLowerCase();
  if (CATEGORY_CONFIG[normalized]) return CATEGORY_CONFIG[normalized];

  return {
    category: 'Office Furniture',
    titlePrefix: `${toReadableName(folderName)} Furniture`,
    basePrice: 16000,
    baseDiscount: 10,
    material: 'Premium engineered wood',
    dimensions: 'Standard',
    colors: ['Natural'],
  };
}

async function collectImageFiles(rootDir: string): Promise<string[]> {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      const nestedFiles = await collectImageFiles(fullPath);
      files.push(...nestedFiles);
      continue;
    }

    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

function resolveFurnitureDir(userProvided?: string) {
  const candidates = [
    userProvided ? path.resolve(userProvided) : '',
    path.resolve(process.cwd(), 'furniture'),
    path.resolve(process.cwd(), '..', 'furniture'),
    path.resolve(__dirname, '../../furniture'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  throw new Error(
    `Furniture folder not found. Checked: ${candidates.join(', ')}`
  );
}

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary env missing. Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

async function resolveCreatedById(dryRun: boolean): Promise<Types.ObjectId> {
  const envCreatedBy = process.env.SEED_CREATED_BY;
  if (envCreatedBy && Types.ObjectId.isValid(envCreatedBy)) {
    return new Types.ObjectId(envCreatedBy);
  }

  const existingUser = await User.findOne().select('_id').sort({ createdAt: 1 });
  if (existingUser?._id) {
    return new Types.ObjectId(existingUser._id);
  }

  if (dryRun) {
    return new Types.ObjectId();
  }

  let seedUser = await User.findOne({ email: DEFAULT_SEED_EMAIL }).select('_id');
  if (!seedUser) {
    seedUser = await User.create({
      name: DEFAULT_SEED_NAME,
      email: DEFAULT_SEED_EMAIL,
      password: '',
      phone: '',
      address: '',
      role: 'customer',
      isVerified: true,
      isActive: true,
    });
    console.log(`Created seed user: ${DEFAULT_SEED_EMAIL}`);
  }

  return new Types.ObjectId(seedUser._id);
}

function buildProductData(filePath: string, fileIndexInFolder: number) {
  const folderName = path.basename(path.dirname(filePath));
  const folderMeta = detectFolderMeta(folderName);
  const fileName = path.parse(filePath).name;
  const readableFromFile = toReadableTitleFromFile(fileName);
  const serial = String(fileIndexInFolder + 1).padStart(2, '0');
  const nameCore = readableFromFile
    ? `${folderMeta.titlePrefix} ${readableFromFile}`
    : folderMeta.titlePrefix;
  const name = `${nameCore} ${serial}`;
  const slug = slugify(`${folderName}-${fileName}-${serial}`);
  const price = folderMeta.basePrice + fileIndexInFolder * 1200;
  const discountPercentage = Math.min(
    35,
    folderMeta.baseDiscount + (fileIndexInFolder % 5) * 2
  );
  const finalPrice = Math.max(
    1,
    Math.round(price - (price * discountPercentage) / 100)
  );

  const description = [
    `${name} is curated from our ${toReadableName(folderName)} collection.`,
    `Built with ${folderMeta.material.toLowerCase()} for everyday durability.`,
    `Designed for Indian homes with practical styling and premium finish.`,
  ].join(' ');

  const sku = `TWS-${slugify(folderName).toUpperCase()}-${serial}`;

  return {
    name,
    slug,
    description,
    category: folderMeta.category,
    price,
    discountPercentage,
    finalPrice,
    stock: 5 + (fileIndexInFolder % 6),
    brand: 'The Wooden Space',
    sku,
    weight: `${28 + fileIndexInFolder} kg`,
    dimensions: folderMeta.dimensions,
    material: folderMeta.material,
    warranty: '12 months',
    returnPolicy: '30 days',
    colors: folderMeta.colors,
    finishes: ['Matte'],
    specifications: [
      { key: 'Collection', value: toReadableName(folderName) },
      { key: 'Material', value: folderMeta.material },
      { key: 'Dimensions', value: folderMeta.dimensions },
      { key: 'Warranty', value: '12 months' },
    ],
    imageLocalPath: filePath,
  };
}

async function uploadToCloudinary(localPath: string, slug: string): Promise<string> {
  const result = await cloudinary.uploader.upload(localPath, {
    folder: 'furniture-products/seed',
    public_id: slug,
    overwrite: true,
    resource_type: 'image',
    unique_filename: false,
  });

  return result.secure_url;
}

async function run() {
  const { dryRun, replaceExisting, furnitureDir: furnitureDirArg } = parseFlags();
  loadEnv();

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri && !dryRun) {
    throw new Error('MONGODB_URI is missing in environment.');
  }

  const furnitureDir = resolveFurnitureDir(furnitureDirArg);
  const imageFiles = await collectImageFiles(furnitureDir);
  imageFiles.sort((a, b) => a.localeCompare(b));

  if (imageFiles.length === 0) {
    console.log(`No image files found inside: ${furnitureDir}`);
    return;
  }

  console.log(`Furniture directory: ${furnitureDir}`);
  console.log(`Images found: ${imageFiles.length}`);
  console.log(`Mode: ${dryRun ? 'dry-run' : 'live'} | replaceExisting=${replaceExisting}`);

  const shouldUseDatabase = !dryRun;
  if (shouldUseDatabase) {
    await mongoose.connect(mongoUri as string, { dbName: DEFAULT_DB_NAME });
  }

  if (!dryRun) {
    configureCloudinary();
  }

  const createdBy = shouldUseDatabase
    ? await resolveCreatedById(dryRun)
    : new Types.ObjectId();

  const folderCounters: Record<string, number> = {};
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const imagePath of imageFiles) {
    const folderName = path.basename(path.dirname(imagePath));
    const currentIndex = folderCounters[folderName] ?? 0;
    folderCounters[folderName] = currentIndex + 1;

    const data = buildProductData(imagePath, currentIndex);
    const existing = shouldUseDatabase
      ? await Product.findOne({ slug: data.slug }).select('_id')
      : null;

    if (existing && !replaceExisting) {
      skippedCount++;
      console.log(`SKIP  ${data.slug} (already exists)`);
      continue;
    }

    try {
      const imageUrl = dryRun
        ? `[dry-run] ${data.imageLocalPath}`
        : await uploadToCloudinary(data.imageLocalPath, data.slug);

      const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        category: data.category,
        price: data.price,
        discountPercentage: data.discountPercentage,
        finalPrice: data.finalPrice,
        image: imageUrl,
        images: [imageUrl],
        stock: data.stock,
        isVisible: true,
        rating: 0,
        reviews: [],
        specifications: data.specifications,
        brand: data.brand,
        sku: data.sku,
        weight: data.weight,
        dimensions: data.dimensions,
        material: data.material,
        warranty: data.warranty,
        returnPolicy: data.returnPolicy,
        colors: data.colors,
        finishes: data.finishes,
        createdBy,
      };

      if (existing && replaceExisting && shouldUseDatabase) {
        if (!dryRun) {
          await Product.updateOne({ _id: existing._id }, { $set: payload });
        }
        updatedCount++;
        console.log(`UPDATE ${data.slug}`);
      } else {
        if (!dryRun && shouldUseDatabase) {
          await Product.create(payload);
        }
        createdCount++;
        console.log(`CREATE ${data.slug}`);
      }
    } catch (error) {
      failedCount++;
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`FAIL  ${data.slug} -> ${message}`);
    }
  }

  console.log('\nSeed summary');
  console.log(`Created: ${createdCount}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Failed : ${failedCount}`);
}

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Seed script failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  });
