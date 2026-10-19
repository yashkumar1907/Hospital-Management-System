const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const DoctorSlot = require("../models/DoctorSlot");

const generateToken = require("../utils/generateToken");

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const parseDateOnly = require("../utils/dateOnly");


exports.registerPatient = async (req, res) => {
    try {
        const body = req.body || {};
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const phone = typeof body.phone === "string" ? body.phone.trim() : "";
        const gender = typeof body.gender === "string" ? body.gender.trim() : "";
        const bloodGroup = typeof body.bloodGroup === "string" ? body.bloodGroup.trim() : "";

        const { dob, password, emergencyContact, allergies, medicalHistory } = body;

        const photo = req.file
            ? req.file.path
            : "";
        
        if (!name || !dob || !gender || !bloodGroup || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });
        }

        if (!/^\S+@\S+\.\S+$/.test(email) || !/^[6-9]\d{9}$/.test(phone)) {
            return res.status(400).json({ success: false, message: "Please provide a valid email and phone number." });
        }

        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
        }

        const birthDate = parseDateOnly(dob);
        if (!birthDate || birthDate > new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z")) {
            return res.status(400).json({ success: false, message: "Please provide a valid date of birth." });
        }

        const existingPatient = await Patient.findOne({
            $or: [
                { email },
                { phone }
            ]
        });

        if (existingPatient) {
            return res.status(400).json({
                success: false,
                message: "Patient with this email or phone already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const patient = new Patient({name, dob, gender, bloodGroup, email, phone, photo, password: hashedPassword, emergencyContact, allergies, medicalHistory});

        await patient.save();

        res.status(201).json({
            success: true,
            message: "Patient registered successfully"
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ success: false, message: "Please check the patient information." });
        }
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "Patient with this email or phone already exists." });
        }

        console.error("Register Patient Error");

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

exports.loginPatient = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const { password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });
        }

        const patient = await Patient.findOne({ email }).select("+password");

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, patient.password);
        
        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: "Invalid password"
            });
        }

        const patientData = {
            _id: patient._id,
            name: patient.name,
            dob: patient.dob,
            gender: patient.gender,
            bloodGroup: patient.bloodGroup,
            email: patient.email,
            phone: patient.phone,
            photo: patient.photo,
            emergencyContact: patient.emergencyContact,
            allergies: patient.allergies,
            medicalHistory: patient.medicalHistory
        };

        const token = generateToken(patient._id, "patient");

        res.status(200).json({
            success: true,
            message: "Login successful",
            patient: patientData,
            token
        });
    }
    catch (error) {
        console.error("Login Patient Error");
    
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

exports.bookAppointment = async (req, res) => {
    try{
        const notes = req.body.notes?.trim();
        const {doctorId, appointmentDate, slotId} = req.body;

        const patientId = req.user.id;

        if (!patientId || !doctorId || !slotId || !appointmentDate) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided."
            });
        }

        if (!mongoose.isValidObjectId(doctorId) || !mongoose.isValidObjectId(slotId)) {
            return res.status(400).json({ success: false, message: "Invalid doctor or slot ID." });
        }

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found."
            });
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found."
            });
        }

        if (!doctor.availability) {
            return res.status(400).json({
                success: false,
                message: "Doctor is currently unavailable."
            });
        }

        const selectedDate = parseDateOnly(appointmentDate);
        if (!selectedDate) {
            return res.status(400).json({ success: false, message: "Please provide a valid appointment date." });
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        if (selectedDate < today) {
            return res.status(400).json({
                success: false,
                message: "Appointment date cannot be in the past."
            });
        }

        const slot = await DoctorSlot.findOneAndUpdate({
            _id: slotId,
            doctorId,
            date: selectedDate,
            status: "Available",
            isActive: true
        }, {
            $set: { status: "Booked" }
        }, {
            returnDocument: "after"
        });
        
        if (!slot) {
            return res.status(404).json({
                success: false,
                message: "Slot not found."
            });
        }

        const appointment = new Appointment({
            patientId,
            doctorId,
            slotId,
            patientName: patient.name,
            department: doctor.specialization,
            doctorName: doctor.name,
            appointmentDate: selectedDate,
            appointmentTime: `${slot.startTime} - ${slot.endTime}`,
            notes
        });
        
        try {
            await appointment.save();
            await DoctorSlot.findOneAndUpdate(
                { _id: slotId, status: "Booked", appointmentId: null },
                { $set: { appointmentId: appointment._id } }
            );
        } catch (error) {
            await DoctorSlot.findOneAndUpdate(
                { _id: slotId, status: "Booked", appointmentId: null },
                { $set: { status: "Available" } }
            );
            throw error;
        }
        
        res.status(201).json({
            success:true,
            message: "Appointment booked successfully"
        });
    }
    catch (error) {
        console.error("Book Appointment Error");
    
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

exports.getPatientAppointments = async (req, res) => {
    try {
        const appointments = await Appointment
            .find({ patientId: req.user.id })
            .populate(
                "doctorId",
                "name specialization photo"
            )
            .sort({
                appointmentDate: -1,
                appointmentTime: 1
            });

        res.status(200).json({
            success: true,
            appointments
        });
    }
    catch (error) {
        console.error("Get Patient Appointments Error");
    
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

exports.cancelAppointment = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid appointment ID." });
        }

        // A conditional update enforces ownership and allows only active appointments.
        const appointment = await Appointment.findOneAndUpdate(
            {
                _id: req.params.id,
                patientId: req.user.id,
                status: { $in: ["Pending", "Confirmed"] }
            },
            { $set: { status: "Cancelled" } },
            { returnDocument: "before", runValidators: true }
        );

        if (!appointment) {
            return res.status(409).json({
                success: false,
                message: "Appointment cannot be cancelled. It may not belong to you or is no longer active."
            });
        }

        if (appointment.slotId) {
            let releasedSlot;
            try {
                releasedSlot = await DoctorSlot.findOneAndUpdate(
                    {
                        _id: appointment.slotId,
                        appointmentId: appointment._id,
                        status: "Booked"
                    },
                    { $set: { status: "Available", appointmentId: null } },
                    { returnDocument: "after" }
                );
            } catch (error) {
                await Appointment.findOneAndUpdate(
                    { _id: appointment._id, patientId: req.user.id, status: "Cancelled" },
                    { $set: { status: appointment.status } },
                    { runValidators: true }
                );
                throw error;
            }

            if (!releasedSlot) {
                // Keep appointment and schedule consistent if its linked slot is missing or stale.
                await Appointment.findOneAndUpdate(
                    { _id: appointment._id, patientId: req.user.id, status: "Cancelled" },
                    { $set: { status: appointment.status } },
                    { runValidators: true }
                );
                return res.status(409).json({
                    success: false,
                    message: "The appointment slot could not be released. Please contact the hospital."
                });
            }
        }

        appointment.status = "Cancelled";

        return res.status(200).json({
            success: true,
            message: "Appointment cancelled successfully.",
            appointment
        });
    } catch (error) {
        console.error("Cancel Appointment Error");
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const name = req.body.name?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const phone = req.body.phone?.trim();
        const gender = req.body.gender?.trim();
        const bloodGroup = req.body.bloodGroup?.trim();

        const { dob, emergencyContact, allergies, medicalHistory } = req.body;

        const photo = req.file
            ? req.file.path
            : undefined;

        const existingPatient = await Patient.findOne({
            _id: { $ne: req.user.id },
            $or: [
                { email },
                { phone }
            ]
        });

        if (existingPatient) {
            return res.status(400).json({
                success: false,
                message: "Email or phone already exists."
            });
        }

        const patient = await Patient.findByIdAndUpdate(
            req.user.id,
            {name, dob, gender, bloodGroup, email, phone, ...(photo && { photo }), emergencyContact, allergies, medicalHistory},
            {
                returnDocument: "after",
                runValidators: true
            }
        ).select("-password");

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            patient
        });
    }
    catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ success: false, message: "Please check the patient information." });
        }
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "Email or phone already exists." });
        }

        console.error("Update Profile Error");
    
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


exports.getAllPatients = async (req, res) => {
    try {
        const patients = await Patient.find(
            {},
            { password: 0 }
        );

        res.status(200).json({
            success: true,
            patients
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

exports.deletePatient = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid patient ID." });
        }

        const appointmentExists = await Appointment.findOne({
            patientId: req.params.id
        });

        if (appointmentExists) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete patient with appointment history"
            });
        }

        const patient = await Patient.findByIdAndDelete(req.params.id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Patient deleted successfully"
        });
    }
    catch (error) {
        console.error("Delete Patient Error");
    
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

exports.getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({
            createdAt: -1
        });

        res.status(200).json({
            success: true,
            appointments
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
