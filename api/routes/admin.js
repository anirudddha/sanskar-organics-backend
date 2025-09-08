// api/routes/admin.js
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { ObjectId } = require('mongodb');

const apiKeyAuthMiddleware = require('../middleware/apiKeyAuthMiddleware')

router.use(apiKeyAuthMiddleware);

// --- ORDER ROUTES (Unchanged) ---
// GET all orders
router.get('/orders/allorders', async (req, res) => {
    try {
        const db = await getDb();
        const orders = await db.collection('orders')
            .find({})
            .sort({ orderDate: -1 })
            .toArray();
        res.json(orders);
    } catch (error) {
        console.error("Error fetching all orders for admin:", error);
        res.status(500).json({ message: "Error fetching all orders", error: error.message });
    }
});

// GET a specific order by its ID
router.get('/orders/:orderId', async (req, res) => {
    try {
        const db = await getDb();
        const orderId = req.params.orderId;
        if (!ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid order ID format." });
        }
        const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }
        res.json(order);
    } catch (error) {
        console.error("Error fetching specific order for admin:", error);
        res.status(500).json({ message: "Error fetching order", error: error.message });
    }
});

// PUT update order status
router.put('/orders/:orderId/status', async (req, res) => {
    try {
        const db = await getDb();
        const orderId = req.params.orderId;
        const { status } = req.body;
        if (!ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid order ID format." });
        }
        if (!status) {
            return res.status(400).json({ message: "Status is required to update." });
        }
        const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Allowed statuses are: ${allowedStatuses.join(', ')}.` });
        }
        const result = await db.collection('orders').updateOne(
            { _id: new ObjectId(orderId) },
            { $set: { status: status, lastStatusUpdate: new Date() } }
        );
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Order not found." });
        }
        res.json({ message: "Order status updated successfully." });
    } catch (error) {
        console.error("Error updating order status for admin:", error);
        res.status(500).json({ message: "Error updating order status", error: error.message });
    }
});

// --- PRODUCT ROUTES (Expanded) ---

// GET all products
router.get('/products/all', async (req, res) => {
    try {
        const db = await getDb();
        const products = await db.collection('products').find({}).sort({ name: 1 }).toArray();
        res.json(products);
    } catch (error) {
        console.error("Error fetching all products for admin:", error);
        res.status(500).json({ message: "Error fetching all products", error: error.message });
    }
});

// ** NEW ** GET a single product by ID
router.get('/products/:productId', async (req, res) => {
    try {
        const db = await getDb();
        const { productId } = req.params;

        if (!ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid product ID format." });
        }

        const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }
        res.json(product);
    } catch (error) {
        console.error("Error fetching single product for admin:", error);
        res.status(500).json({ message: "Error fetching product", error: error.message });
    }
});


// POST to create a new product
router.post('/products/create', async (req, res) => {
    try {
        const db = await getDb();
        const productData = req.body;

        if (!productData || !productData.name || !productData.price) {
            return res.status(400).json({ message: "Product name and price are required." });
        }

        const productWithDefaults = {
            ...productData,
            images: Array.isArray(productData.images) ? productData.images : [],
            price: parseFloat(productData.price),
            stock: parseInt(productData.stock, 10) || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: productData.isActive === undefined ? true : productData.isActive,
        };

        const result = await db.collection('products').insertOne(productWithDefaults);
        res.status(201).json({ message: "Product created successfully", product: { _id: result.insertedId, ...productWithDefaults } });
    } catch (error) {
        console.error("Error creating product for admin:", error);
        res.status(500).json({ message: "Error creating product", error: error.message });
    }
});

// ** NEW ** PUT to update an existing product
router.put('/products/:productId', async (req, res) => {
    try {
        const db = await getDb();
        const { productId } = req.params;
        const updateData = req.body;

        if (!ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid product ID format." });
        }

        // Remove _id from update data to prevent errors
        delete updateData._id;

        // Ensure numbers are stored correctly
        if (updateData.price) updateData.price = parseFloat(updateData.price);
        if (updateData.stock) updateData.stock = parseInt(updateData.stock, 10);
        
        const result = await db.collection('products').updateOne(
            { _id: new ObjectId(productId) },
            { $set: { ...updateData, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        res.json({ message: "Product updated successfully." });
    } catch (error) {
        console.error("Error updating product for admin:", error);
        res.status(500).json({ message: "Error updating product", error: error.message });
    }
});

// ** NEW ** DELETE a product
router.delete('/products/:productId', async (req, res) => {
    try {
        const db = await getDb();
        const { productId } = req.params;

        if (!ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid product ID format." });
        }

        const result = await db.collection('products').deleteOne({ _id: new ObjectId(productId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        res.json({ message: "Product deleted successfully." });
    } catch (error) {
        console.error("Error deleting product for admin:", error);
        res.status(500).json({ message: "Error deleting product", error: error.message });
    }
});


module.exports = router;