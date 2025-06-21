// api/routes/addresses.js
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// Middleware to ensure DB is connected and attach it to the request object.
router.use((req, res, next) => {
    try {
        req.db = require('../db').getDb(); // Get the MongoDB connection instance
        next();
    } catch (error) {
        res.status(500).json({ message: error.message || "Database not connected." });
    }
});

// Helper function to validate address data
const validateAddress = (address) => {
    const errors = [];
    if (!address.street || address.street.trim() === '') errors.push("Street is required.");
    if (!address.city || address.city.trim() === '') errors.push("City is required.");
    if (!address.state || address.state.trim() === '') errors.push("State is required.");
    if (!address.postalCode || address.postalCode.trim() === '') errors.push("Postal Code is required.");
    if (!address.country || address.country.trim() === '') errors.push("Country is required.");
    return errors;
};

// POST (Add new address)
router.post('/', async (req, res) => {
    try {
        const userId = req.firebaseUser.uid;
        const { address, isDefault } = req.body; // Expecting address object and an optional isDefault flag

        if (!address) {
            return res.status(400).json({ message: "Address object is required." });
        }

        const validationErrors = validateAddress(address);
        if (validationErrors.length > 0) {
            return res.status(400).json({ message: "Validation failed.", errors: validationErrors });
        }

        // If isDefault is true, unset default from other addresses for this user
        if (isDefault) {
            await req.db.collection('addresses').updateMany(
                { userId: userId },
                { $set: { isDefault: false } }
            );
        }

        const newAddress = {
            userId: userId,
            ...address, // Spread the address properties
            isDefault: isDefault || false, // Default to false if not provided or null
            createdAt: new Date()
        };

        const result = await req.db.collection('addresses').insertOne(newAddress);

        res.status(201).json({ message: "Address added successfully", addressId: result.insertedId, address: newAddress });

    } catch (error) {
        console.error("Error adding address:", error);
        res.status(500).json({ message: "Error adding address", error: error.message });
    }
});

// GET (View all addresses for the logged-in user)
router.get('/', async (req, res) => {
    try {
        const userId = req.firebaseUser.uid;

        const addresses = await req.db.collection('addresses')
            .find({ userId: userId })
            .sort({ isDefault: -1, createdAt: -1 }) // Default address first, then by creation date
            .toArray();

        res.json(addresses);
    } catch (error) {
        console.error("Error fetching addresses:", error);
        res.status(500).json({ message: "Error fetching addresses", error: error.message });
    }
});

// GET (View a specific address by its MongoDB ID)
router.get('/:addressId', async (req, res) => {
    try {
        const userId = req.firebaseUser.uid;
        const addressId = req.params.addressId;

        if (!ObjectId.isValid(addressId)) {
            return res.status(400).json({ message: "Invalid address ID format." });
        }

        const address = await req.db.collection('addresses').findOne({
            _id: new ObjectId(addressId),
            userId: userId // Ensure the user is fetching their own address
        });

        if (!address) {
            return res.status(404).json({ message: "Address not found or you do not have access." });
        }

        res.json(address);
    } catch (error) {
        console.error("Error fetching specific address:", error);
        res.status(500).json({ message: "Error fetching address", error: error.message });
    }
});

// PUT (Update an existing address)
router.put('/:addressId', async (req, res) => {
    try {
        const userId = req.firebaseUser.uid;
        const addressId = req.params.addressId;
        const { address, isDefault } = req.body; // Updated address properties and flag

        if (!ObjectId.isValid(addressId)) {
            return res.status(400).json({ message: "Invalid address ID format." });
        }

        if (!address && isDefault === undefined) {
            return res.status(400).json({ message: "No update data provided. Provide address properties or isDefault." });
        }

        // Validate provided address if it exists in the body
        if (address) {
            const validationErrors = validateAddress(address);
            if (validationErrors.length > 0) {
                return res.status(400).json({ message: "Validation failed for updated address.", errors: validationErrors });
            }
        }

        // If isDefault is true, unset default from other addresses for this user
        if (isDefault === true) {
            await req.db.collection('addresses').updateMany(
                { userId: userId, _id: { $ne: new ObjectId(addressId) } }, // Exclude the current address
                { $set: { isDefault: false } }
            );
        }
         // If isDefault is explicitly set to false, no need to update others unless it was the only default
         // The logic above handles setting new defaults correctly.

        // Construct update object
        const updateFields = { updatedAt: new Date() };
        if (address) {
            // Add only provided address fields to prevent overwriting missing ones
            for (const key in address) {
                if (address.hasOwnProperty(key)) {
                    updateFields[key] = address[key];
                }
            }
        }
        if (isDefault !== undefined) {
            updateFields.isDefault = isDefault;
        }

        const result = await req.db.collection('addresses').updateOne(
            { _id: new ObjectId(addressId), userId: userId },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Address not found or does not belong to the user." });
        }
        if (result.modifiedCount === 0 && isDefault !== undefined && !address) {
             return res.status(200).json({ message: "Address found but no changes applied (e.g., isDefault was already set)." });
        }

        // Fetch the updated address to return
        const updatedAddress = await req.db.collection('addresses').findOne({ _id: new ObjectId(addressId) });

        res.json({ message: "Address updated successfully", address: updatedAddress });

    } catch (error) {
        console.error("Error updating address:", error);
        res.status(500).json({ message: "Error updating address", error: error.message });
    }
});

// DELETE (Remove an address)
router.delete('/:addressId', async (req, res) => {
    try {
        const userId = req.firebaseUser.uid;
        const addressId = req.params.addressId;

        if (!ObjectId.isValid(addressId)) {
            return res.status(400).json({ message: "Invalid address ID format." });
        }

        // Optional: Check if the address to be deleted is the default one.
        // If it is, you might want to automatically set another address as default
        // or prevent deletion if it's the last address.
        const addressToDelete = await req.db.collection('addresses').findOne({ _id: new ObjectId(addressId), userId: userId });
        if (!addressToDelete) {
            return res.status(404).json({ message: "Address not found or does not belong to the user." });
        }

        if (addressToDelete.isDefault) {
            // Find another address for this user and set it as default
            const nextDefaultAddress = await req.db.collection('addresses').findOne({
                userId: userId,
                _id: { $ne: new ObjectId(addressId) } // Not the one being deleted
            });
            if (nextDefaultAddress) {
                await req.db.collection('addresses').updateOne(
                    { _id: nextDefaultAddress._id },
                    { $set: { isDefault: true } }
                );
                console.log(`Set next default address ${nextDefaultAddress._id} for user ${userId}`);
            } else {
                // If this was the only address, no need to do anything special, it will just be deleted
                console.log(`No other address found for user ${userId} to set as default after deletion.`);
            }
        }

        const result = await req.db.collection('addresses').deleteOne({ _id: new ObjectId(addressId), userId: userId });

        if (result.deletedCount > 0) {
            res.json({ message: "Address deleted successfully." });
        } else {
            // This case should be caught by the initial findOne check, but good for robustness.
            res.status(404).json({ message: "Address not found or does not belong to the user." });
        }
    } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json({ message: "Error deleting address", error: error.message });
    }
});

module.exports = router;