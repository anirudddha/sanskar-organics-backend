// api/routes/addresses.js (FIXED)
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// Assuming your db connection is in a services directory
const { getDb } = require('../db'); 

// Helper function to validate address data (remains the same)
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
        const db = await getDb();
        // FIX: Use the standardized req.user object
        const userId = req.user.userId;
        const { address, isDefault } = req.body;

        if (!address) {
            return res.status(400).json({ message: "Address object is required." });
        }

        const validationErrors = validateAddress(address);
        if (validationErrors.length > 0) {
            return res.status(400).json({ message: "Validation failed.", errors: validationErrors });
        }

        if (isDefault) {
            await db.collection('addresses').updateMany(
                { userId: userId },
                { $set: { isDefault: false } }
            );
        }

        const newAddress = {
            userId: userId,
            ...address,
            isDefault: isDefault || false,
            createdAt: new Date()
        };

        const result = await db.collection('addresses').insertOne(newAddress);
        res.status(201).json({ message: "Address added successfully", addressId: result.insertedId, address: newAddress });
    } catch (error) {
        console.error("Error adding address:", error);
        res.status(500).json({ message: "Error adding address", error: error.message });
    }
});

// GET (View all addresses for the logged-in user)
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        // FIX: Use the standardized req.user object
        const userId = req.user.userId;

        const addresses = await db.collection('addresses')
            .find({ userId: userId })
            .sort({ isDefault: -1, createdAt: -1 })
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
        const db = await getDb();
        // FIX: Use the standardized req.user object
        const userId = req.user.userId;
        const addressId = req.params.addressId;

        if (!ObjectId.isValid(addressId)) {
            return res.status(400).json({ message: "Invalid address ID format." });
        }

        const address = await db.collection('addresses').findOne({
            _id: new ObjectId(addressId),
            userId: userId
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
        const db = await getDb();
        // FIX: Use the standardized req.user object
        const userId = req.user.userId;
        const addressId = req.params.addressId;
        const { address, isDefault } = req.body;

        if (!ObjectId.isValid(addressId)) {
            return res.status(400).json({ message: "Invalid address ID format." });
        }

        if (!address && isDefault === undefined) {
            return res.status(400).json({ message: "No update data provided. Provide address properties or isDefault." });
        }

        if (address) {
            const validationErrors = validateAddress(address);
            if (validationErrors.length > 0) {
                return res.status(400).json({ message: "Validation failed for updated address.", errors: validationErrors });
            }
        }

        if (isDefault === true) {
            await db.collection('addresses').updateMany(
                { userId: userId, _id: { $ne: new ObjectId(addressId) } },
                { $set: { isDefault: false } }
            );
        }

        const updateFields = { updatedAt: new Date() };
        if (address) {
            for (const key in address) {
                if (address.hasOwnProperty(key)) {
                    updateFields[key] = address[key];
                }
            }
        }
        if (isDefault !== undefined) {
            updateFields.isDefault = isDefault;
        }

        const result = await db.collection('addresses').updateOne(
            { _id: new ObjectId(addressId), userId: userId },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Address not found or does not belong to the user." });
        }
        if (result.modifiedCount === 0 && isDefault !== undefined && !address) {
             return res.status(200).json({ message: "Address found but no changes applied (e.g., isDefault was already set)." });
        }

        const updatedAddress = await db.collection('addresses').findOne({ _id: new ObjectId(addressId) });
        res.json({ message: "Address updated successfully", address: updatedAddress });
    } catch (error) {
        console.error("Error updating address:", error);
        res.status(500).json({ message: "Error updating address", error: error.message });
    }
});

// DELETE (Remove an address)
router.delete('/:addressId', async (req, res) => {
    try {
        const db = await getDb();
        // FIX: Use the standardized req.user object
        const userId = req.user.userId;
        const addressId = req.params.addressId;

        if (!ObjectId.isValid(addressId)) {
            return res.status(400).json({ message: "Invalid address ID format." });
        }

        const addressToDelete = await db.collection('addresses').findOne({ _id: new ObjectId(addressId), userId: userId });
        if (!addressToDelete) {
            return res.status(404).json({ message: "Address not found or does not belong to the user." });
        }

        if (addressToDelete.isDefault) {
            const nextDefaultAddress = await db.collection('addresses').findOne({
                userId: userId,
                _id: { $ne: new ObjectId(addressId) }
            });
            if (nextDefaultAddress) {
                await db.collection('addresses').updateOne(
                    { _id: nextDefaultAddress._id },
                    { $set: { isDefault: true } }
                );
            }
        }

        const result = await db.collection('addresses').deleteOne({ _id: new ObjectId(addressId), userId: userId });

        if (result.deletedCount > 0) {
            res.json({ message: "Address deleted successfully." });
        } else {
            res.status(404).json({ message: "Address not found or does not belong to the user." });
        }
    } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json({ message: "Error deleting address", error: error.message });
    }
});

module.exports = router;