// api/routes/products.js
const express = require('express');
const router = express.Router();
const { getDb } = require('../db'); 
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');

// Middleware to attach the DB instance to each request in this router.
router.use((req, res, next) => {
    try {
        req.db = getDb();
        next();
    } catch (error) {
        res.status(500).json({ message: error.message || "Database not connected." });
    }
});

// --- PUBLIC ROUTES ---

// GET all products
router.get('/', async (req, res) => {
    try {
        const products = await req.db.collection('products').find({}).toArray();
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Error fetching products", error: error.message });
    }
});

// GET a single product by ID
router.get('/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({ message: "Invalid product ID. Must be a number." });
        }
        const product = await req.db.collection('products').findOne({ id: productId });

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: "Product not found." });
        }
    } catch (error) { // FIX: Removed the erroneous '=>' from this line
        console.error(`Error fetching product with ID ${req.params.id}:`, error);
        res.status(500).json({ message: "Error fetching product", error: error.message });
    }
});

// --- PROTECTED ROUTES (Require Authentication) ---

// POST a new product (Protected)
router.post('/', firebaseAuthMiddleware, async (req, res) => {
    try {
        const newProduct = { 
            ...req.body, 
            createdBy: req.firebaseUser.uid, // Optionally track who created it
            createdAt: new Date() 
        };

        if (!newProduct.id || !newProduct.name || !newProduct.price || !newProduct.image || !newProduct.images) {
            return res.status(400).json({ message: "Missing required product fields (id, name, price, image, images)." });
        }
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

// PUT (Update) an existing product by ID (Protected)
router.put('/:id', firebaseAuthMiddleware, async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({ message: "Invalid product ID. Must be a number." });
        }
        const updatedProduct = req.body;
        delete updatedProduct._id;
        updatedProduct.updatedAt = new Date();
        updatedProduct.updatedBy = req.firebaseUser.uid; // Optionally track who updated it

        const result = await req.db.collection('products').updateOne(
            { id: productId },
            { $set: updatedProduct }
        );

        if (result.matchedCount > 0) {
            res.json({ message: "Product updated successfully." });
        } else {
            res.status(404).json({ message: "Product not found." });
        }
    } catch (error) {
        console.error(`Error updating product with ID ${req.params.id}:`, error);
        res.status(500).json({ message: "Error updating product", error: error.message });
    }
});

// DELETE a product by ID (Protected)
router.delete('/:id', firebaseAuthMiddleware, async (req, res) => {
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