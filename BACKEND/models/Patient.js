const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    dob: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        required: true,
        trim: true
    },
    bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address."]
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number."]
    },
    photo: {
        type: String,
        default: ""
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false
    },
    emergencyContact: {
        type: String,
        default: "",
        trim: true,
        match: [/^$|^[6-9]\d{9}$/, "Please enter a valid emergency contact number."]
    },
    allergies: {
        type: String,
        default: "",
        trim: true
    },
    medicalHistory: {
        type: String,
        default: "",
        trim: true
    }
},
    {
        timestamps:true
    }
);

module.exports = mongoose.model("Patient", patientSchema);