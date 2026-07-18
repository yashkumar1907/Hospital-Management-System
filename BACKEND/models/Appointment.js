const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true
    },
    doctorId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true
    },
    slotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DoctorSlot",
        default: null
    },
    patientName: {
        type: String,
        required: true,
        trim:true
    },
    department:{
        type:String,
        enum:["Cardiology", "Neurology", "Orthopedics", "Dermatology", "Pediatrics"],
        required:true
    },
    doctorName: {
        type: String,
        required: true,
        trim:true
    },
    appointmentDate: {
        type: Date,
        required: true,
        index: true
    },
    appointmentTime: {
        type: String,
        required: true,
        trim:true
    },
    notes:{
        type:String,
        trim:true,
        default:""
    },
    status:{
        type:String,
        enum:["Pending", "Confirmed", "Completed", "Cancelled"],
        default:"Pending"
    }
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Appointment", appointmentSchema);