const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    specialization: {
        type: String,
        enum: ["Cardiology", "Neurology", "Orthopedics", "Dermatology", "Pediatrics", "General Medicine"],
        required: true
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
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false
    },
    photo: {
        type: String,
        default: ""
    },
    qualification: {
        type: String,
        default: "",
        trim: true
    },
    experience: {
        type: Number,
        default: 0,
        min: 0
    },
    about: {
        type: String,
        default: "",
        trim: true
    },
    availability: {
        type: Boolean,
        default: true
    },
    consultationFee: {
        type: Number,
        default: 500,
        min: 0
    }
},
    {
        timestamps:true
    }
);


doctorSchema.index({ specialization: 1 });

module.exports = mongoose.model("Doctor", doctorSchema);