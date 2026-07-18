const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    specialization: {
        type: String,
        enum: ["Cardiology", "Neurology", "Orthopedics", "Dermatology", "Pediatrics"],
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone:{
        type:String,
        required:true,
        unique:true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
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

module.exports = mongoose.model("Doctor", doctorSchema);