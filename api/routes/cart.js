// api/routes/cart.js (FIXED)
const express = require('express');
const router = express.Router();
// Assuming your db connection is in a services directory as per your structure
const { getDb } = require('../db'); 
const { ObjectId } = require('mongodb');

// GET user's cart
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        // FIX: Use the standardized req.user object from the unified middleware
        const userId = req.user.userId;

        // Safety check
        if (!userId) {
            return res.status(403).json({ message: "User ID not found in token." });
        }

        const cart = await db.collection('carts').findOne({ userId: userId });

        if (cart) {
            // Ensure prices are numbers when retrieved, in case they were stored as strings or invalid
            const sanitizedItems = (cart.items || []).map(item => ({
                ...item,
                price: typeof item.price === 'number' ? item.price : 0,
                quantity: typeof item.quantity === 'number' ? item.quantity : 0
            }));
            res.json(sanitizedItems); // Return sanitized items
        } else {
            res.json([]); // No cart found, return empty array
        }
    } catch (error) {
        console.error("Error fetching user's cart:", error);
        res.status(500).json({ message: "Error fetching cart", error: error.message });
    }
});

// POST (Add/Update item to cart)
router.post('/', async (req, res) => {
    try {
        const db = await getDb();
        // FIX: Use the standardized req.user object from the unified middleware
        const userId = req.user.userId;
        const { productId, quantity, selectedVariant, variantDetails } = req.body;

        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({ message: "productId and quantity are required, and quantity must be positive." });
        }

        // Fetch product details to ensure it exists and get name/price/variants
        const product = await db.collection('products').findOne({ id: parseInt(productId) });
        if (!product) {
            return res.status(404).json({ message: `Product with ID ${productId} not found.` });
        }

        let itemPrice = product.price; // Base product price
        let itemUnit = product.unit;   // Base product unit
        let itemVariantDetails = null; // To store variant info like { unit, price }

        if (product.variants && product.variants.length > 0) {
            if ((!selectedVariant || selectedVariant.unit === undefined || selectedVariant.price === undefined) && !variantDetails) {
                return res.status(400).json({ message: "Selected variant details are required for this product." });
            }
            
            if (variantDetails) {
                itemPrice = variantDetails.price;
                itemUnit = variantDetails.unit;
                itemVariantDetails = variantDetails;
            } else {
                itemPrice = selectedVariant.price;
                itemUnit = selectedVariant.unit;
                itemVariantDetails = {
                    unit: selectedVariant.unit,
                    price: selectedVariant.price,
                    weight_in_grams:selectedVariant?.weight_in_grams
                };
            }
        }

        const sanitizedPrice = typeof itemPrice === 'number' && itemPrice !== null ? itemPrice : 0;
        const sanitizedQuantity = typeof quantity === 'number' ? quantity : 1;

        let cart = await db.collection('carts').findOne({ userId: userId });

        if (!cart) {
            cart = {
                userId: userId,
                items: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }

        const existingItemIndex = cart.items.findIndex(item =>
            item.productId === parseInt(productId) &&
            JSON.stringify(item.variantDetails) === JSON.stringify(itemVariantDetails)
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity = sanitizedQuantity;
        } else {
            cart.items.push({
                productId: parseInt(productId),
                name: product.name,
                price: sanitizedPrice,
                quantity: sanitizedQuantity,
                unit: itemUnit,
                variantDetails: itemVariantDetails,
                addedAt: new Date()
            });
        }

        cart.updatedAt = new Date();

        const result = await db.collection('carts').updateOne(
            { userId: userId },
            { $set: cart },
            { upsert: true }
        );

        if (result.upsertedCount > 0 || result.modifiedCount > 0) {
            res.status(201).json({ message: "Item added/updated in cart successfully.", cart: cart });
        } else {
            res.status(500).json({ message: "Failed to update cart." });
        }
    } catch (error) {
        console.error("Error adding/updating item to cart:", error);
        res.status(500).json({ message: "Error processing cart request", error: error.message });
    }
});

// DELETE (Remove item from cart)
router.delete('/:productId', async (req, res) => {
    try {
        const db = await getDb();
        // FIX: Use the standardized req.user object from the unified middleware
        const userId = req.user.userId;
        const productIdToRemove = parseInt(req.params.productId);
        const variantUnit = req.body.variant;

        if (isNaN(productIdToRemove)) {
            return res.status(400).json({ message: "Invalid product ID. Must be a number." });
        }

        const cart = await db.collection('carts').findOne({ userId: userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found." });
        }

        const initialItemCount = cart.items.length;
        cart.items = cart.items.filter(item =>
            item.productId !== productIdToRemove
            || item.variantDetails?.unit !== variantUnit
        );

        if (cart.items.length === initialItemCount) {
            return res.status(404).json({ message: `Product with ID ${productIdToRemove} and specified variant not found in cart.` });
        }

        cart.updatedAt = new Date();

        if (cart.items.length === 0) {
            await db.collection('carts').deleteOne({ userId: userId });
            res.json({ message: "Item removed from cart. Cart is now empty and has been deleted." });
        } else {
            await db.collection('carts').updateOne(
                { userId: userId },
                { $set: cart }
            );
            res.json({ message: "Item removed from cart successfully.", cart: cart });
        }
    } catch (error) {
        console.error("Error removing item from cart:", error);
        res.status(500).json({ message: "Error removing item from cart", error: error.message });
    }
});

// DELETE (Clear entire cart)
router.delete('/', async (req, res) => {
    try {
        const db = await getDb();
        // FIX: Use the standardized req.user object from the unified middleware
        const userId = req.user.userId;
        const result = await db.collection('carts').deleteOne({ userId: userId });

        if (result.deletedCount > 0) {
            res.json({ message: "Cart cleared successfully." });
        } else {
            res.status(404).json({ message: "Cart not found or already empty." });
        }
    } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).json({ message: "Error clearing cart", error: error.message });
    }
});

module.exports = router;