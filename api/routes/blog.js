const express = require('express');
const router = express.Router();

const { 
    createPost, 
    getAllPosts, 
    getPostBySlug, 
    updatePost, 
    deletePost 
} = require('../controllers/blogController');

const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');
const apiKeyAuthMiddleware = require('../middleware/apiKeyAuthMiddleware');

// Public Routes
router.get('/', getAllPosts);
router.get('/:slug', getPostBySlug);

// Admin Routes (require authentication and admin privileges)
router.post('/', firebaseAuthMiddleware, apiKeyAuthMiddleware, createPost);
router.put('/:id', firebaseAuthMiddleware, apiKeyAuthMiddleware, updatePost);
router.delete('/:id', firebaseAuthMiddleware, apiKeyAuthMiddleware, deletePost);

module.exports = router;