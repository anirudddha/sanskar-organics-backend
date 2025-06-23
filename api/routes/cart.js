// api/routes/cart.js
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { ObjectId } = require('mongodb');

// GET user's cart
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.firebaseUser.uid;
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
        const userId = req.firebaseUser.uid;
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
                // If product has variants, frontend MUST send selectedVariant details
                return res.status(400).json({ message: "Selected variant details are required for this product." });
            }
            // Use the price and unit from the selected variant

            if (variantDetails) {
                itemPrice = variantDetails.price;
                itemUnit = variantDetails.unit;
                itemVariantDetails = variantDetails;
            }
            else {
                itemPrice = selectedVariant.price;
                itemUnit = selectedVariant.unit;
                // Store the variant details for matching later
                itemVariantDetails = {
                    unit: selectedVariant.unit,
                    price: selectedVariant.price // Store the price from the variant
                };
            }

        }

        // Sanitize price and quantity before storing
        const sanitizedPrice = typeof itemPrice === 'number' && itemPrice !== null ? itemPrice : 0;
        const sanitizedQuantity = typeof quantity === 'number' ? quantity : 1;

        // Find the user's cart or create one
        let cart = await db.collection('carts').findOne({ userId: userId });

        if (!cart) {
            cart = {
                userId: userId,
                items: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }

        // Check if the product with the SAME variant is already in the cart
        const existingItemIndex = cart.items.findIndex(item =>
            item.productId === parseInt(productId) && // Match by productId
            JSON.stringify(item.variantDetails) === JSON.stringify(itemVariantDetails) // Match by variant details (as objects)
        );

        if (existingItemIndex > -1) {
            // Item (with this variant) already exists, update quantity
            cart.items[existingItemIndex].quantity = sanitizedQuantity;
            // Important: If price could change for a variant, you might need to re-evaluate.
            // For simplicity, we keep the price from when it was first added or updated.
            // cart.items[existingItemIndex].price = sanitizedPrice; // Option to update price if needed
        } else {
            // Add new item to the cart with variant details
            cart.items.push({
                productId: parseInt(productId),
                name: product.name,
                price: sanitizedPrice,
                quantity: sanitizedQuantity,
                unit: itemUnit, // Store the unit (e.g., '250g')
                variantDetails: itemVariantDetails, // Store the variant details object for accurate matching
                addedAt: new Date()
            });
        }

        cart.updatedAt = new Date();

        // Update or insert the cart
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
// This needs to be able to remove specific items, potentially by productId AND variant details.
// For now, it removes all items matching productId, which might be too broad if variants exist.
// A more robust solution would require sending variant info (e.g., unit) in the URL or body.
// For simplicity, let's assume removing by productId is acceptable for now.
// If you need to remove a SPECIFIC variant, the route might need to be like /cart/item/:itemId or /cart/:productId/:variantUnit
router.delete('/:productId', async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.firebaseUser.uid;
        const productIdToRemove = parseInt(req.params.productId);
        const variantUnit = req.body.variant;
        // To remove a specific variant, you'd need its unit or a unique cart item ID.
        // For now, we'll assume it removes ALL instances of this productId from the cart.
        // If you need to remove a specific variant, the frontend needs to send that info.

        if (isNaN(productIdToRemove)) {
            return res.status(400).json({ message: "Invalid product ID. Must be a number." });
        }

        const cart = await db.collection('carts').findOne({ userId: userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found." });
        }

        const initialItemCount = cart.items.length;
        // Filter out the item to remove based on productId.
        // If you need to remove a SPECIFIC variant, you'd add another condition here,
        // e.g., `item => item.productId !== productIdToRemove || item.unit !== req.body.variantUnitToRemove`
        cart.items = cart.items.filter(item =>
            item.productId !== productIdToRemove
            || item.variantDetails?.unit !== variantUnit
        );

        if (cart.items.length === initialItemCount) {
            return res.status(404).json({ message: `Product with ID ${productIdToRemove} not found in cart.` });
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
        const userId = req.firebaseUser.uid;
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