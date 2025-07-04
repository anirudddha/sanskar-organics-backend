const express = require('express');
const router = express.Router();

const { 
    createPost, 
    getAllPosts, 
    getPostBySlug, 
    updatePost, 
    deletePost,

    getAllPostsAdmin,
    getPostById
} = require('../controllers/blogController');

const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');
const apiKeyAuthMiddleware = require('../middleware/apiKeyAuthMiddleware');

// Public Routes
router.get('/', getAllPosts);
router.get('/:slug', getPostBySlug);


// GET all posts for the admin list (including drafts)
router.get('/admin/all', apiKeyAuthMiddleware, getAllPostsAdmin);

// GET a single post by ID for the edit form
router.get('/admin/:id', apiKeyAuthMiddleware, getPostById);


// Admin Routes (require authentication and admin privileges)
router.post('/', apiKeyAuthMiddleware, createPost);
router.put('/:id', apiKeyAuthMiddleware, updatePost);
router.delete('/:id', apiKeyAuthMiddleware, deletePost);

module.exports = router;