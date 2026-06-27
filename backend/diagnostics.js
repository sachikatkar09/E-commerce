const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const connectDB = require('./config/db');

dotenv.config();

const runDiagnostics = async () => {
  try {
    console.log('\n========== SHOPNEST BACKEND DIAGNOSTICS ==========\n');

    // Test 1: Database Connection
    console.log('[TEST 1] Checking MongoDB Connection...');
    await connectDB();
    console.log('✓ MongoDB connection successful\n');

    // Test 2: Product Model Schema
    console.log('[TEST 2] Checking Product Model Schema...');
    const productSchema = Product.schema;
    console.log('Product Schema Fields:');
    Object.keys(productSchema.paths).forEach(key => {
      if (key !== '__v' && key !== '_id') {
        const field = productSchema.paths[key];
        console.log(`  - ${key}: ${field.instance} (required: ${field.isRequired})`);
      }
    });
    console.log('✓ Product schema is valid\n');

    // Test 3: Check Products Collection
    console.log('[TEST 3] Checking Products Collection...');
    const productCount = await Product.countDocuments();
    console.log(`Total products in database: ${productCount}`);
    
    if (productCount > 0) {
      const sample = await Product.findOne();
      console.log(`Sample product: ${sample.name}`);
      console.log(`Sample product data:`, JSON.stringify(sample, null, 2));
    } else {
      console.log('⚠️  No products found in database');
    }
    console.log('✓ Products collection query successful\n');

    // Test 4: Simulate getProducts Query
    console.log('[TEST 4] Simulating getProducts Query...');
    const products = await Product.find({});
    console.log(`✓ Query successful, returned ${products.length} products`);
    console.log('Product structure:', products.length > 0 ? JSON.stringify(products[0], null, 2).substring(0, 300) : 'No products');
    console.log('\n');

    console.log('========== ALL DIAGNOSTICS PASSED ==========\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ DIAGNOSTIC ERROR:', error.message);
    console.error('Stack:', error.stack);
    console.error('\n========== DIAGNOSTICS FAILED ==========\n');
    process.exit(1);
  }
};

runDiagnostics();
