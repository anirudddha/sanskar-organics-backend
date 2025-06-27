// api/routes/testimonials.js (backend)
const express = require('express');
const router = express.Router();
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');
const { getDb } = require('../db');
const { ObjectId } = require('mongodb');


router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const testimonials = await db.collection('testimonials')
      .find({})
      .sort({ date: -1 })
      .toArray();

    res.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ message: 'Error fetching testimonials', error: error.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid testimonial ID.' });
    }

    const testimonial = await db.collection('testimonials').findOne({ _id: new ObjectId(id) });
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found.' });
    }

    res.json(testimonial);
  } catch (error) {
    console.error(`Error fetching testimonial ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching testimonial', error: error.message });
  }
});


router.post('/', firebaseAuthMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.firebaseUser.uid;
    const { message, userName, stars } = req.body; // <-- Destructure 'stars' here

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required.' });
    }
    // --- Add validation for stars ---
    if (typeof stars !== 'number' || stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'Invalid star rating. Please provide a number between 1 and 5.' });
    }

    const name = userName && userName.trim().length > 0
      ? userName.trim()
      : (req.firebaseUser.name || req.firebaseUser.email || 'Anonymous');

    const testimonial = {
      userId,
      userName: name,
      message: message.trim(),
      stars: stars, // <-- Store the stars value
      date: new Date()
    };

    const result = await db.collection('testimonials').insertOne(testimonial);

    res.status(201).json({
      message: 'Testimonial submitted successfully!',
      testimonialId: result.insertedId,
      testimonial: { _id: result.insertedId, ...testimonial } // Return the stored testimonial with stars
    });
  } catch (error) {
    console.error('Error submitting testimonial:', error);
    // Specific error handling for invalid stars might be good here too, if needed.
    res.status(500).json({ message: 'Error submitting testimonial', error: error.message });
  }
});


router.get('/my-testimonials', firebaseAuthMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.firebaseUser.uid;

    const userTestimonials = await db.collection('testimonials')
      .find({ userId: userId })
      .sort({ date: -1 })
      .toArray();

    res.json(userTestimonials);
  } catch (error) {
    console.error(`Error fetching testimonials for user ${req.firebaseUser.uid}:`, error);
    res.status(500).json({ message: 'Error fetching user testimonials', error: error.message });
  }
});

module.exports = router;
