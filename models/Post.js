/**
 * Post Schema and Model
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var PostSchema = new Schema({
    title: { type: String, required: true },
    tags: [ { type: String } ],
    is_published: { type: Boolean, default: false },
    content: { type: String, required: true },
    created: { type: Date, default: Date.now() },
    updated: { type: Date, default: Date.now() },
    read: { type: Number, default: 0 },
    likes: { type: Number, default: 0}
});

exports.Post = mongoose.model('Post', PostSchema);