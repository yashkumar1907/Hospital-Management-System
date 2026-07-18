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
        lowercase: true
    },
    phone:{
        type:String,
        required:true,
        unique:true,
        trim: true
    },
    photo: {
        type: String,
        default: ""
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    emergencyContact: {
        type: String,
        default: "",
        trim: true
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