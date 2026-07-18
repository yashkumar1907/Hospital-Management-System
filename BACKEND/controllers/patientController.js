const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const DoctorSlot = require("../models/DoctorSlot");

const generateToken = require("../utils/generateToken");

const bcrypt = require("bcryptjs");


exports.registerPatient = async (req, res) => {
    try {
        const name = req.body.name?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const phone = req.body.phone?.trim();
        const gender = req.body.gender?.trim();
        const bloodGroup = req.body.bloodGroup?.trim();

        const {dob, photo, password, emergencyContact, allergies, medicalHistory} = req.body;

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

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required."
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
        res.status(500).json({
            success: false,
            message: error.message
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

        const patient = await Patient.findOne({ email });

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
            photo: patient.photo
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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.bookAppointment = async (req, res) => {
    try{
        const patientName = req.body.patientName?.trim();
        const doctorName = req.body.doctorName?.trim();
        const department = req.body.department?.trim();
        const appointmentTime = req.body.appointmentTime?.trim();
        const notes = req.body.notes?.trim();
        const {doctorId, appointmentDate, slotId} = req.body;

        const patientId = req.user.id;

        if (!patientId || !doctorId || !slotId || !patientName || !doctorName || !department || !appointmentDate || !appointmentTime) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided."
            });
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

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const selectedDate = new Date(appointmentDate);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            return res.status(400).json({
                success: false,
                message: "Appointment date cannot be in the past."
            });
        }

        const slot = await DoctorSlot.findById(slotId);
        if (!slot) {
            return res.status(404).json({
                success: false,
                message: "Slot not found."
            });
        }

        if (slot.status !== "Available") {
            return res.status(400).json({
                success: false,
                message: "Selected slot is not available."
            });
        }

        const appointment = new Appointment({
            patientId,
            doctorId,
            slotId,
            patientName,
            department,
            doctorName,
            appointmentDate,
            appointmentTime,
            notes
        });
        
        await appointment.save();

        await DoctorSlot.findByIdAndUpdate(
            slotId,
            {
                status: "Booked",
                appointmentId: appointment._id
            }
        );
        
        res.status(201).json({
            success:true,
            message: "Appointment booked successfully"
        });
    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
};

exports.getPatientAppointments = async (req, res) => {
    try {
        const appointments = await Appointment
            .find({ patientId: req.user.id })
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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const name = req.body.name?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const phone = req.body.phone?.trim();
        const gender = req.body.gender?.trim();
        const bloodGroup = req.body.bloodGroup?.trim();

        const {dob, photo, emergencyContact, allergies, medicalHistory} = req.body;

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
            {name, dob, gender, bloodGroup, email, phone, photo, emergencyContact, allergies, medicalHistory},
            {
                new: true
            }
        );

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
        res.status(500).json({
            success: false,
            message: error.message
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
            message: error.message
        });
    }
};

exports.deletePatient = async (req, res) => {
    try {
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
        res.status(500).json({
            success: false,
            message: error.message
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
            message: error.message
        });
    }
};