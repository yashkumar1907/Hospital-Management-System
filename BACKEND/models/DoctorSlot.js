const mongoose = require("mongoose");

const doctorSlotSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true,
        trim: true
    },
    endTime: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ["Available", "Booked", "Cancelled", "Blocked"],
        default: "Available"
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true
    }
);

// Prevent duplicate slots for the same doctor, date and start time
doctorSlotSchema.index({
    doctorId: 1,
    date: 1,
    startTime: 1
},
    {
        unique: true
    }
);

module.exports = mongoose.model("DoctorSlot", doctorSlotSchema);