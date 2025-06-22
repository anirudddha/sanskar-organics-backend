// api/routes/orders.js
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// Middleware to ensure DB is connected and attach it to the request object.
router.use((req, res, next) => {
    try {
        req.db = require('../db').getDb();
        next();
    } catch (error) {
        res.status(500).json({ message: error.message || "Database not connected." });
    }
});

// POST (Create Order) - From Cart
router.post('/', async (req, res) => {
    try {
        const userId = req.firebaseUser.uid;
        const { selectedAddressId } = req.body; // Expecting selectedAddressId

        if (!selectedAddressId) {
            return res.status(400).json({ message: "Please select a delivery address for your order." });
        }

        if (!ObjectId.isValid(selectedAddressId)) {
            return res.status(400).json({ message: "Invalid address ID format." });
        }

        // Fetch the user's cart
        const cart = await req.db.collection('carts').findOne({ userId: userId });

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({ message: "Your cart is empty. Add items before creating an order." });
        }

        // Fetch the selected shipping address for the user
        const shippingAddress = await req.db.collection('addresses').findOne({
            _id: new ObjectId(selectedAddressId),
            userId: userId
        });

        if (!shippingAddress) {
            return res.status(404).json({ message: "Selected address not found or does not belong to the user." });
        }

        // Create the order document
        const order = {
            userId: userId,
            items: cart.items.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price, // Price at the time of order
                quantity: item.quantity,
                unit: item.unit,   // Unit for the item (e.g., '250g')
                // If you also store variantDetails in cart, include them here too for order history
                variantDetails: item.variantDetails || null
            })),
            totalAmount: cart.items.reduce((sum, item) => {
                const price = typeof item.price === 'number' ? item.price : 0;
                const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
                return sum + (price * quantity);
            }, 0),
            orderDate: new Date(),
            status: 'Pending',
            shippingAddress: { // Store the full shipping address details
                name: shippingAddress.name,
                street: shippingAddress.street,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postalCode: shippingAddress.postalCode,
                country: shippingAddress.country,
                phoneNumber: shippingAddress.phoneNumber
            },
        };

        // Insert the order into the 'orders' collection
        const orderResult = await req.db.collection('orders').insertOne(order);

        // Clear the user's cart after successful order creation
        await req.db.collection('carts').deleteOne({ userId: userId });

        res.status(201).json({ message: "Order placed successfully!", orderId: orderResult.insertedId, order: order });

    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: "Error creating order", error: error.message });
    }
});

// GET user's order history
router.get('/', async (req, res) => {
    try {
        const userId = req.firebaseUser.uid;
        const orders = await req.db.collection('orders')
            .find({ userId: userId })
            .sort({ orderDate: -1 })
            .toArray();
        res.json(orders);
    } catch (error) {
        console.error("Error fetching order history:", error);
        res.status(500).json({ message: "Error fetching order history", error: error.message });
    }
});

// GET a specific order by its ID (for the current user)
router.get('/:orderId', async (req, res) => {
    try {
        const userId = req.firebaseUser.uid;
        const orderId = req.params.orderId;

        if (!ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid order ID format." });
        }

        const order = await req.db.collection('orders').findOne({
            _id: new ObjectId(orderId),
            userId: userId
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found or you do not have access to this order." });
        }

        res.json(order);
    } catch (error) {
        console.error("Error fetching specific order:", error);
        res.status(500).json({ message: "Error fetching order", error: error.message });
    }
});


router.post('/direct', async (req, res) => { // Changed path to '/direct'
    try {
        const userId = req.firebaseUser.uid;
        const { selectedAddressId, items } = req.body; // Expecting selectedAddressId and an 'items' array

        if (!selectedAddressId) {
            return res.status(400).json({ message: "Please select a delivery address for your order." });
        }

        if (!ObjectId.isValid(selectedAddressId)) {
            return res.status(400).json({ message: "Invalid address ID format." });
        }

        // Validate that we received at least one item and it's not from the cart
        // (The frontend should ensure this, but backend validation is good)
        if (!items || items.length === 0) {
            // This is where we want to avoid the "cart is empty" message
            return res.status(400).json({ message: "No items provided for a direct order. Please select a product." });
        }
        // Optional: Further validation to ensure the item is not marked as 'cartItem' if your items have such flags.

        // Fetch the selected shipping address for the user
        const shippingAddress = await req.db.collection('addresses').findOne({
            _id: new ObjectId(selectedAddressId),
            userId: userId
        });

        if (!shippingAddress) {
            return res.status(404).json({ message: "Selected address not found or does not belong to the user." });
        }

        // Calculate total amount from the provided items array
        const totalAmount = items.reduce((sum, item) => {
            const price = typeof item.price === 'number' ? item.price : 0;
            const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
            return sum + (price * quantity);
        }, 0);

        // Create the order document using the provided items
        const order = {
            userId: userId,
            items: items.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price, // Price at the time of order
                quantity: item.quantity,
                unit: item.unit,   // Unit for the item (e.g., '250g')
                // Include variantDetails if passed from frontend
                variantDetails: item.selectedVariant || null
            })),
            totalAmount: totalAmount,
            orderDate: new Date(),
            status: 'Pending', // Initial status for a direct order
            shippingAddress: { // Store the full shipping address details
                name: shippingAddress.name,
                street: shippingAddress.street,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postalCode: shippingAddress.postalCode,
                country: shippingAddress.country,
                phoneNumber: shippingAddress.phoneNumber
            },
        };

        // Insert the order into the 'orders' collection
        const orderResult = await req.db.collection('orders').insertOne(order);

        // *** IMPORTANT ***: We DO NOT clear the cart here because this order was NOT from the cart.

        res.status(201).json({ message: "Direct order placed successfully!", orderId: orderResult.insertedId, order: order });

    } catch (error) {
        console.error("Error creating direct order:", error);
        // Provide a more specific error message for direct orders
        res.status(500).json({ message: "Error creating direct order", error: error.message });
    }
});

module.exports = router;