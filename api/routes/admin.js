// api/routes/admin.js
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { ObjectId } = require('mongodb');

const apiKeyAuthMiddleware = require('../middleware/apiKeyAuthMiddleware')

router.use(apiKeyAuthMiddleware);

// GET all orders
// Accessible at: GET /admin/orders/allorders
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
// Accessible at: GET /admin/orders/:orderId
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
// Accessible at: PUT /admin/orders/:orderId/status
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


router.get('/products/all', async (req, res) => {
    try {
        const db = await getDb();
        // Fetch all products, perhaps with more details than the public API
        const products = await db.collection('products').find({}).toArray();
        res.json(products);
    } catch (error) {
        console.error("Error fetching all products for admin:", error);
        res.status(500).json({ message: "Error fetching all products", error: error.message });
    }
});

// POST to create a new product (example for admin)
// Accessible at: POST /admin/products/create
router.post('/products/create', async (req, res) => {
    try {
        const db = await getDb();
        const newProduct = req.body; // Assuming the frontend sends the product data

        // Basic validation (add more as needed)
        if (!newProduct || !newProduct.name || !newProduct.price) {
            return res.status(400).json({ message: "Product name and price are required." });
        }

        // You might want to add default values, categorize, handle images etc.
        const productWithDefaults = {
            ...newProduct,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Add other fields like isActive, stock, etc. if applicable
            isActive: newProduct.isActive === undefined ? true : newProduct.isActive,
            stock: newProduct.stock === undefined ? 0 : newProduct.stock,
            // Handle image uploads separately if complex
        };

        const result = await db.collection('products').insertOne(productWithDefaults);
        res.status(201).json({ message: "Product created successfully", productId: result.insertedId });

    } catch (error) {
        console.error("Error creating product for admin:", error);
        res.status(500).json({ message: "Error creating product", error: error.message });
    }
});


module.exports = router;