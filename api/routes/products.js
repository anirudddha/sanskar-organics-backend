// api/routes/products.js (Updated)
const express = require('express');
const { getDb } = require('../db'); // Correct path to db.js (relative to api/routes)

const router = express.Router();

// Middleware to ensure DB is connected and attach it to the request object.
// This handles the req.db = getDb() part. It's good practice to have this
// per-route-group or globally if you use the same DB for all.
router.use((req, res, next) => {
    try {
        req.db = getDb(); // Attach the database instance to the request
        next();
    } catch (error) {
        res.status(500).json({ message: error.message || "Database not connected." });
    }
});

// GET all products
router.get('/', async (req, res) => {
    try {
        // req.firebaseUser is available thanks to the firebaseAuthMiddleware
        // console.log("Fetching products for Firebase user:", req.firebaseUser.uid);
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
        console.log(`Fetching product ${req.params.id} for Firebase user:`, req.firebaseUser.uid);
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
// This route is now protected. We can also store the ID of the user who created the product.
router.post('/', async (req, res) => {
    try {
        // Include the Firebase user's UID as 'createdBy'
        const newProduct = { ...req.body, createdBy: req.firebaseUser.uid, createdAt: new Date() };

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
// This route is now protected. You can add logic to ensure only the creator can update.
router.put('/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({ message: "Invalid product ID. Must be a number." });
        }
        const updatedProduct = req.body;
        delete updatedProduct._id; // Remove _id if present, as we're updating by 'id' field
        updatedProduct.updatedAt = new Date(); // Add an updated timestamp

        // Optional: Add logic to ensure only the creator can update
        // const productToUpdate = await req.db.collection('products').findOne({ id: productId });
        // if (productToUpdate && productToUpdate.createdBy !== req.firebaseUser.uid) {
        //     return res.status(403).json({ message: "Forbidden: You can only update products you created." });
        // }


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
// This route is now protected. You can add logic to ensure only the creator can delete.
router.delete('/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({ message: "Invalid product ID. Must be a number." });
        }

        // Optional: Add logic to ensure only the creator can delete
        // const productToDelete = await req.db.collection('products').findOne({ id: productId });
        // if (productToDelete && productToDelete.createdBy !== req.firebaseUser.uid) {
        //     return res.status(403).json({ message: "Forbidden: You can only delete products you created." });
        // }

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