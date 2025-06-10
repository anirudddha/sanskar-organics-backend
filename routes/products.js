// routes/products.js
const express = require('express');
const { getDb } = require('../db'); // Import getDb to access the connected database

const router = express.Router();

// Middleware to ensure DB is connected and attach it to the request object.
// This handles the req.db = getDb() part.
router.use((req, res, next) => {
    try {
        req.db = getDb(); // Attach the database instance to the request
        next();
    } catch (error) {
        // If getDb() throws an error (e.g., database not connected), handle it here
        res.status(500).json({ message: error.message || "Database not connected." });
    }
});

// GET all products
router.get('/', async (req, res) => {
    try {
        // As authentication has been removed, req.userId is no longer available.
        // Removed: console.log("Fetching products for user:", req.userId);
        const products = await req.db.collection('products').find({}).toArray();
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Error fetching products", error: error.message });
    }
});

// GET a single product by ID (using the 'id' field, not _id)
router.get('/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id); // Convert ID to integer
        if (isNaN(productId)) {
            return res.status(400).json({ message: "Invalid product ID. Must be a number." });
        }
        const product = await req.db.collection('products').findOne({ id: productId });

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: "Product not found." });
        }
    } catch (error) {
        console.error(`Error fetching product with ID ${req.params.id}:`, error);
        res.status(500).json({ message: "Error fetching product", error: error.message });
    }
});

// POST a new product
// NOTE: With authentication removed, anyone can add products.
// Consider adding an API key or other simple protection if this is not desired.
router.post('/', async (req, res) => {
    try {
        const newProduct = req.body;
        // Basic validation: ensure 'id', 'name', 'price', 'image', 'images' are present
        if (!newProduct.id || !newProduct.name || !newProduct.price || !newProduct.image || !newProduct.images) {
            return res.status(400).json({ message: "Missing required product fields (id, name, price, image, images)." });
        }
        // Check if a product with the same 'id' already exists
        const existingProduct = await req.db.collection('products').findOne({ id: newProduct.id });
        if (existingProduct) {
            return res.status(409).json({ message: `Product with ID ${newProduct.id} already exists.` });
        }

        const result = await req.db.collection('products').insertOne(newProduct);
        res.status(201).json({ message: "Product added successfully", insertedId: result.insertedId, product: newProduct });
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ message: "Error adding product", error: error.message });
    }
});

// PUT (Update) an existing product by ID
// NOTE: With authentication removed, anyone can update products.
// Consider adding an API key or other simple protection if this is not desired.
router.put('/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({ message: "Invalid product ID. Must be a number." });
        }
        const updatedProduct = req.body;
        delete updatedProduct._id; // Remove _id if present, as we're updating by 'id' field

        const result = await req.db.collection('products').updateOne(
            { id: productId },
            { $set: updatedProduct }
        );

        if (result.matchedCount > 0) {
            if (result.modifiedCount > 0) {
                res.json({ message: "Product updated successfully." });
            } else {
                res.status(200).json({ message: "Product found but no changes applied." });
            }
        } else {
            res.status(404).json({ message: "Product not found." });
        }
    } catch (error) {
        console.error(`Error updating product with ID ${req.params.id}:`, error);
        res.status(500).json({ message: "Error updating product", error: error.message });
    }
});

// DELETE a product by ID
// NOTE: With authentication removed, anyone can delete products.
// Consider adding an API key or other simple protection if this is not desired.
router.delete('/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({ message: "Invalid product ID. Must be a number." });
        }
        const result = await req.db.collection('products').deleteOne({ id: productId });

        if (result.deletedCount > 0) {
            res.json({ message: "Product deleted successfully." });
        } else {
            res.status(404).json({ message: "Product not found." });
        }
    } catch (error) {
        console.error(`Error deleting product with ID ${req.params.id}:`, error);
        res.status(500).json({ message: "Error deleting product", error: error.message });
    }
});

module.exports = router;