const Product = require('../models/Product');
let cloudinary;
try {
  cloudinary = require('../config/cloudinary');
  console.log('[productController] Cloudinary initialized successfully');
} catch (error) {
  console.error('[productController] Warning: Cloudinary failed to initialize:', error.message);
  console.error('[productController] File uploads will not work until cloudinary is configured');
  cloudinary = null;
}

const getProducts = async (req, res) => {
  try {
    console.log('[getProducts] Fetching all products from database...');
    const products = await Product.find({});
    console.log(`[getProducts] Successfully fetched ${products.length} products`);
    res.json(products);
  } catch (error) {
    console.error('[getProducts] Error fetching products:', error);
    console.error('[getProducts] Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching products',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getProductById = async (req, res) => {
  try {
    console.log(`[getProductById] Fetching product with ID: ${req.params.id}`);
    const product = await Product.findById(req.params.id);
    if (product) {
      console.log(`[getProductById] Product found: ${product.name}`);
      res.json(product);
    } else {
      console.log(`[getProductById] Product not found for ID: ${req.params.id}`);
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('[getProductById] Error fetching product:', error);
    res.status(500).json({ 
      message: 'Error fetching product',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const createProduct = async (req, res) => {
  try {
    console.log('[createProduct] Creating new product:', req.body);
    const { name, description, price, category, stock } = req.body;
    let imageUrl = '';
    if (req.file) {
      if (!cloudinary) {
        throw new Error('Cloudinary is not configured. Please check your environment variables.');
      }
      console.log('[createProduct] Uploading image to Cloudinary...');
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
      console.log('[createProduct] Image uploaded successfully:', imageUrl);
    }
    const product = new Product({
      name, description, price, category, stock, imageUrl
    });
    const createdProduct = await product.save();
    console.log('[createProduct] Product created successfully:', createdProduct._id);
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('[createProduct] Error creating product:', error);
    res.status(500).json({ 
      message: 'Error creating product',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    console.log(`[updateProduct] Updating product with ID: ${req.params.id}`);
    const { name, description, price, category, stock } = req.body;
    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.category = category || product.category;
      product.stock = stock || product.stock;

      if (req.file) {
        if (!cloudinary) {
          throw new Error('Cloudinary is not configured. Please check your environment variables.');
        }
        console.log('[updateProduct] Uploading new image to Cloudinary...');
        const result = await cloudinary.uploader.upload(req.file.path);
        product.imageUrl = result.secure_url;
        console.log('[updateProduct] Image uploaded successfully:', product.imageUrl);
      }
      const updatedProduct = await product.save();
      console.log(`[updateProduct] Product updated successfully: ${updatedProduct._id}`);
      res.json(updatedProduct);
    } else {
      console.log(`[updateProduct] Product not found for ID: ${req.params.id}`);
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('[updateProduct] Error updating product:', error);
    res.status(500).json({ 
      message: 'Error updating product',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    console.log(`[deleteProduct] Deleting product with ID: ${req.params.id}`);
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      console.log(`[deleteProduct] Product deleted successfully: ${req.params.id}`);
      res.json({ message: 'Product removed' });
    } else {
      console.log(`[deleteProduct] Product not found for ID: ${req.params.id}`);
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('[deleteProduct] Error deleting product:', error);
    res.status(500).json({ 
      message: 'Error deleting product',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
