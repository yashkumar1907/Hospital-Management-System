const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ["Appointment", "Medical Inquiry", "Complaint", "Feedback", "Billing", "General Inquiry"]
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ["New", "Read", "Replied", "Closed"],
        default: "New"
    },
    adminReply: {
        type: String,
        trim: true,
        default: ""
    },
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model("ContactMessage", contactMessageSchema);