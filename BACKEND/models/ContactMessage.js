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
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address."]
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number."]
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


contactMessageSchema.index({ status: 1 });

module.exports = mongoose.model("ContactMessage", contactMessageSchema);