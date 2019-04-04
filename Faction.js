const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const armouryEventSchema = new Schema({
    id: {
        type: Number,
        unique: true,
        required: true
    },
    raw: { type: String },
    date: { type: Date },
    type: { type: String },
    item: { type: String },
    user: { type: String },

})

const FactionSchema = new Schema({
    id: {
        type: Number,
        unique: true,
        required: true
    },
    name: {
        type: String
    },
    armoury: [armouryEventSchema],
}, {
        timestamps: true
    });

module.exports = mongoose.model('Faction', FactionSchema);