const { getDb } = require('../db'); // Import your database helper
const { ObjectId } = require('mongodb'); // Import ObjectId for lookups

// Helper function to generate a URL-friendly slug. We move this here from the old model.
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

// @desc    Create a new blog post
// @route   POST /api/blog
// @access  Private/Admin
exports.createPost = async (req, res) => {
    try {
        const db = await getDb();
        const { title, content, featuredImage, tags, status } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required.' });
        }

        // Manually create the document to be inserted
        const newPost = {
            title,
            slug: slugify(title), // Generate slug here
            content,
            author: 'Sanskar Organics Admin', // Or from req.user.name if you want
            featuredImage: featuredImage || '',
            tags: tags || [],
            status: status || 'published',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('blogposts').insertOne(newPost);
        
        // Return the document that was just created
        res.status(201).json({ ...newPost, _id: result.insertedId });

    } catch (error) {
        // Handle MongoDB's duplicate key error (if you have a unique index on slug/title)
        if (error.code === 11000) {
           return res.status(409).json({ message: 'A blog post with this title already exists.' });
        }
        console.error("Error creating blog post:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all published blog posts
// @route   GET /api/blog
// @access  Public
exports.getAllPosts = async (req, res) => {
    try {
        const db = await getDb();
        const posts = await db.collection('blogposts')
            .find({ status: 'published' })
            .sort({ createdAt: -1 })
            .toArray();
        res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching all posts:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get a single blog post by its slug
// @route   GET /api/blog/:slug
// @access  Public
exports.getPostBySlug = async (req, res) => {
    try {
        const db = await getDb();
        const post = await db.collection('blogposts').findOne({ slug: req.params.slug });
        
        if (!post) {
            return res.status(404).json({ message: 'Blog post not found.' });
        }
        res.status(200).json(post);
    } catch (error) {
        console.error("Error fetching post by slug:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a blog post by ID
// @route   PUT /api/blog/:id
// @access  Private/Admin
exports.updatePost = async (req, res) => {
    try {
        const db = await getDb();
        const postId = req.params.id;
        
        if (!ObjectId.isValid(postId)) {
            return res.status(400).json({ message: 'Invalid post ID format.' });
        }

        const { title, content, featuredImage, tags, status } = req.body;
        
        const updateFields = {
            updatedAt: new Date()
        };

        // Dynamically add fields to the update object if they exist in the request
        if (title) {
            updateFields.title = title;
            updateFields.slug = slugify(title); // Also update the slug if title changes
        }
        if (content) updateFields.content = content;
        if (featuredImage) updateFields.featuredImage = featuredImage;
        if (tags) updateFields.tags = tags;
        if (status) updateFields.status = status;
        
        const result = await db.collection('blogposts').updateOne(
            { _id: new ObjectId(postId) },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Blog post not found.' });
        }

        res.status(200).json({ message: 'Blog post updated successfully.' });

    } catch (error)
    {
        if (error.code === 11000) {
           return res.status(409).json({ message: 'A blog post with this title already exists.' });
        }
        console.error("Error updating blog post:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a blog post by ID
// @route   DELETE /api/blog/:id
// @access  Private/Admin
exports.deletePost = async (req, res) => {
    try {
        const db = await getDb();
        const postId = req.params.id;

        if (!ObjectId.isValid(postId)) {
            return res.status(400).json({ message: 'Invalid post ID format.' });
        }

        const result = await db.collection('blogposts').deleteOne({ _id: new ObjectId(postId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Blog post not found.' });
        }
        
        res.status(200).json({ message: 'Blog post removed successfully.' });

    } catch (error) {
        console.error("Error deleting blog post:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


exports.getAllPostsAdmin = async (req, res) => {
    try {
        const db = await getDb();
        const posts = await db.collection('blogposts')
            .find({}) // Find all, no status filter
            .sort({ createdAt: -1 })
            .toArray();
        res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching all posts for admin:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get a single blog post by its ID for editing
// @route   GET /api/blog/admin/:id
// @access  Private/Admin (API Key)
exports.getPostById = async (req, res) => {
    try {
        const db = await getDb();
        const postId = req.params.id;

        if (!ObjectId.isValid(postId)) {
            return res.status(400).json({ message: 'Invalid post ID format.' });
        }

        const post = await db.collection('blogposts').findOne({ _id: new ObjectId(postId) });
        
        if (!post) {
            return res.status(404).json({ message: 'Blog post not found.' });
        }
        res.status(200).json(post);
    } catch (error) {
        console.error("Error fetching post by ID for admin:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};