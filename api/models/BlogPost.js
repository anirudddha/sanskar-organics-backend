const mongoose = require('mongoose');

const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

const blogPostSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, unique: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        content: { type: String, required: true }, // Store HTML from a rich-text editor
        author: { type: String, default: 'Sanskar Organics Admin' },
        featuredImage: { type: String, default: '' }, // URL to an image
        tags: [String],
        status: { type: String, enum: ['draft', 'published'], default: 'published' },
    },
    { timestamps: true }
);

blogPostSchema.pre('validate', function (next) {
    if (this.title && this.isModified('title')) {
        this.slug = slugify(this.title);
    }
    next();
});

module.exports = mongoose.model('BlogPost', blogPostSchema);