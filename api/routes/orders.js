// api/routes/orders.js
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { ObjectId } = require('mongodb');

// Helper function to calculate total amount safely
const calculateTotal = (items = []) => {
    return items.reduce((sum, item) => {
        const price = typeof item.price === 'number' ? item.price : 0;
        const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
        return sum + (price * quantity);
    }, 0);
};


// POST (Create Order) - From Cart
router.post('/', async (req, res) => {
    try {
        const db = await getDb();
        // STANDARDIZED: Use req.user.userId to be consistent with the addresses route
        const userId = req.user.userId;
        const { selectedAddressId } = req.body;

        if (!selectedAddressId || !ObjectId.isValid(selectedAddressId)) {
            return res.status(400).json({ message: "A valid address ID must be provided." });
        }

        const [cart, shippingAddress] = await Promise.all([
            db.collection('carts').findOne({ userId: userId }),
            db.collection('addresses').findOne({ _id: new ObjectId(selectedAddressId), userId: userId })
        ]);

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({ message: "Your cart is empty. Add items before creating an order." });
        }

        if (!shippingAddress) {
            return res.status(404).json({ message: "Selected address not found or does not belong to the user." });
        }

        const order = {
            userId: userId,
            items: cart.items.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                unit: item.unit,
                variantDetails: item.variantDetails || null
            })),
            totalAmount: calculateTotal(cart.items),
            orderDate: new Date(),
            status: 'Pending',
            shippingAddress: {
                name: shippingAddress.name,
                street: shippingAddress.street,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postalCode: shippingAddress.postalCode,
                country: shippingAddress.country,
                phoneNumber: shippingAddress.phoneNumber
            },
        };

        const orderResult = await db.collection('orders').insertOne(order);
        await db.collection('carts').deleteOne({ userId: userId });

        res.status(201).json({ message: "Order placed successfully!", orderId: orderResult.insertedId, order: order });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: "Error creating order", error: error.message });
    }
});

// GET user's order history
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        // STANDARDIZED: Use req.user.userId
        const userId = req.user.userId;
        const orders = await db.collection('orders')
            .find({ userId: userId })
            .sort({ orderDate: -1 })
            .toArray();
        res.json(orders);
    } catch (error) {
        console.error("Error fetching order history:", error);
        res.status(500).json({ message: "Error fetching order history", error: error.message });
    }
});

// GET a specific order by its ID
router.get('/:orderId', async (req, res) => {
    try {
        const db = await getDb();
        // STANDARDIZED: Use req.user.userId
        const userId = req.user.userId;
        const { orderId } = req.params;

        if (!ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid order ID format." });
        }

        const order = await db.collection('orders').findOne({
            _id: new ObjectId(orderId),
            userId: userId
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found or you do not have access." });
        }
        res.json(order);
    } catch (error) {
        console.error("Error fetching specific order:", error);
        res.status(500).json({ message: "Error fetching order", error: error.message });
    }
});


// POST (Create Order) - Direct Buy
router.post('/direct', async (req, res) => {
    try {
        const db = await getDb();
        // STANDARDIZED: Use req.user.userId
        const userId = req.user.userId;
        const { selectedAddressId, items } = req.body;

        if (!selectedAddressId || !ObjectId.isValid(selectedAddressId)) {
            return res.status(400).json({ message: "A valid address ID must be provided." });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "No items provided for a direct order." });
        }

        const shippingAddress = await db.collection('addresses').findOne({
            _id: new ObjectId(selectedAddressId),
            userId: userId
        });

        if (!shippingAddress) {
            return res.status(404).json({ message: "Selected address not found or does not belong to the user." });
        }

        const order = {
            userId: userId,
            items: items.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                unit: item.unit,
                variantDetails: item.selectedVariant || null
            })),
            totalAmount: calculateTotal(items),
            orderDate: new Date(),
            status: 'Pending',
            shippingAddress: {
                name: shippingAddress.name,
                street: shippingAddress.street,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postalCode: shippingAddress.postalCode,
                country: shippingAddress.country,
                phoneNumber: shippingAddress.phoneNumber
            },
        };

        const orderResult = await db.collection('orders').insertOne(order);

        // NOTE: We do not clear the cart here.

        res.status(201).json({ message: "Direct order placed successfully!", orderId: orderResult.insertedId, order: order });
    } catch (error) {
        console.error("Error creating direct order:", error);
        res.status(500).json({ message: "Error creating direct order", error: error.message });
    }
});

module.exports = router;