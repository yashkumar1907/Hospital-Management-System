const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const DoctorSlot = require("../models/DoctorSlot");

const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

exports.addDoctor = async (req, res) => {
    try {
        const {specialization, phone, password, qualification, experience, about, availability, consultationFee} = req.body;

        const name = req.body.name?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const photo = req.file ? `/uploads/doctors/${req.file.filename}` : "";

        const existingDoctor = await Doctor.findOne({
            $or: [
                { email },
                { phone }
            ]
        });

        if (existingDoctor) {
            return res.status(400).json({
                success: false,
                message: "Doctor with this email or phone already exists."
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required."
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const doctor = new Doctor({name, specialization, email, phone, password: hashedPassword, photo, qualification, experience, about, availability, consultationFee});

        await doctor.save();

        res.status(201).json({
            success: true,
            message: "Doctor added successfully"
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.loginDoctor = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const { password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });
        }

        const doctor = await Doctor.findOne({ email });
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, doctor.password);
        
        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: "Invalid password"
            });
        }

        const doctorData = {
            _id: doctor._id,
            name: doctor.name,
            specialization: doctor.specialization,
            email: doctor.email,
            phone: doctor.phone,
            photo: doctor.photo
        };

        const token = generateToken(doctor._id, "doctor");

        res.status(200).json({
            success: true,
            message: "Login successful",
            doctor: doctorData,
            token
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find(
            {},
            { password: 0 }
        );
        res.status(200).json({
            success: true,
            doctors
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getDoctorAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({
            doctorId: req.user.id
        }).sort({
            appointmentDate: 1
        });

        res.status(200).json({
            success: true,
            appointments
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatus = ["Pending", "Confirmed", "Completed", "Cancelled"];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment status"
            });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        if (status === "Cancelled" && appointment.slotId) {
            await DoctorSlot.findByIdAndUpdate(
                appointment.slotId,
                {
                    status: "Available",
                    appointmentId: null
                }
            );
        }

        res.status(200).json({
            success: true,
            message: "Appointment status updated",
            appointment
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateDoctor = async (req, res) => {
    try {
        const name = req.body.name?.trim();
        const specialization = req.body.specialization?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const phone = req.body.phone?.trim();
        const qualification = req.body.qualification?.trim();
        const about = req.body.about?.trim();

        const {password, experience, availability, consultationFee} = req.body;

        const existingDoctor = await Doctor.findOne({
            _id: { $ne: req.user.id },
            $or: [
                { email },
                { phone }
            ]
        });

        if (existingDoctor) {
            return res.status(400).json({
                success: false,
                message: "Doctor with this email or phone already exists."
            });
        }

        const doctor = await Doctor.findByIdAndUpdate(
            req.user.id,
            {
                name,
                specialization,
                email,
                phone,
                password,
                qualification,
                experience,
                about,
                availability,
                consultationFee
            },
            {
                new: true
            }
        );

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Doctor updated successfully",
            doctor
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteDoctor = async (req, res) => {
    try {
        const appointmentExists = await Appointment.findOne({doctorId:req.params.id});
        if(appointmentExists){
            return res.status(400).json({
                success:false,
                message: "Doctor has appointment history"
            });
        }
        
        const doctor = await Doctor.findByIdAndDelete(req.params.id);
        if(!doctor){
            return res.status(404).json({
                success:false,
                message: "Doctor not found"
            });
        }
        res.status(200).json({
            success:true,
            message: "Doctor deleted successfully"
        });
    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
}