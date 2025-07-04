const mongoose = require('mongoose');

// --- UPDATED slugify function ---
// Now allows Devanagari characters (for Marathi) in the slug.
const slugify = (text) => {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')                      // Replace spaces with -
        .replace(/[^\w\u0900-\u097F\-]+/g, '')    // Remove all non-word chars except Devanagari and dash
        .replace(/\-\-+/g, '-')                    // Replace multiple - with single -
        .replace(/^-+/, '')                        // Trim - from start of text
        .replace(/-+$/, '');                       // Trim - from end of text
};

// --- NEW: Sub-schema for localized content ---
// This keeps our code DRY (Don't Repeat Yourself).
// _id: false is important to prevent Mongoose from creating an _id for the sub-document.
const localizedContentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required for this language.'],
        trim: true,
    },
    slug: {
        type: String,
        lowercase: true,
        // unique and sparse allow multiple documents to have a null/missing slug,
        // but a slug that exists must be unique. This is perfect for our use case.
        unique: true, 
        sparse: true,
    },
    content: {
        type: String,
        default: '',
    },
}, { _id: false });


// --- UPDATED main blog post schema ---
const blogPostSchema = new mongoose.Schema(
    {
        // Language-specific content is now nested
        en: {
            type: localizedContentSchema,
            required: true,
        },
        mr: {
            type: localizedContentSchema,
            required: true,
        },
        // Shared fields remain at the top level
        author: {
            type: String,
            default: 'Sanskar Organics Admin',
        },
        featuredImage: {
            type: String,
            default: '',
        },
        tags: [String],
        status: {
            type: String,
            enum: ['draft', 'published'],
            default: 'published',
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

// --- UPDATED pre-validate hook for multilingual slugs ---
// This hook now runs before validation and generates slugs for both languages if their titles have been modified.
blogPostSchema.pre('validate', function (next) {
    if (this.en && this.isModified('en.title')) {
        this.en.slug = slugify(this.en.title);
    }
    if (this.mr && this.isModified('mr.title')) {
        this.mr.slug = slugify(this.mr.title);
    }
    next();
});

// For database performance and integrity, it's good practice to define indexes.
blogPostSchema.index({ 'en.slug': 1 });
blogPostSchema.index({ 'mr.slug': 1 });

module.exports = mongoose.model('BlogPost', blogPostSchema);