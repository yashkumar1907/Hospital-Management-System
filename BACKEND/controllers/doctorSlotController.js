const Doctor = require("../models/Doctor");
const DoctorSlot = require("../models/DoctorSlot");
const mongoose = require("mongoose");
const parseDateOnly = require("../utils/dateOnly");

exports.generateSlots = async (req, res) => {
    try {
        const {date } = req.body;

        const doctorId = req.user.id;

        if (!doctorId || !date) {
            return res.status(400).json({
                success: false,
                message: "Doctor ID and date are required."
            });
        }

        const selectedDate = parseDateOnly(date);
        if (!selectedDate) {
            return res.status(400).json({ success: false, message: "Please provide a valid date." });
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        if (selectedDate < today) {
            return res.status(400).json({
                success: false,
                message: "Cannot generate slots for a past date."
            });
        }

        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found."
            });
        }

        const existingSlots = await DoctorSlot.find({
            doctorId,
            date: selectedDate
        });

        if (existingSlots.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Slots already generated for this date."
            });
        }

        const slots = [];

        let hour = 10;
        let minute = 0;

        while (hour < 17) {
            const startHour = hour;
            const startMinute = minute;

            minute += 30;

            if (minute === 60) {
                hour++;
                minute = 0;
            }

            const endHour = hour;
            const endMinute = minute;

            slots.push({
                doctorId,
                date: selectedDate,
                startTime: `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`,
                endTime: `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`
            });
        }

        try {
            await DoctorSlot.insertMany(slots);
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({ success: false, message: "Slots already generated for this date." });
            }
            throw error;
        }

        res.status(201).json({
            success: true,
            message: "Doctor slots generated successfully."
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

exports.getAvailableSlots = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.doctorId)) {
            return res.status(400).json({ success: false, message: "Invalid doctor ID." });
        }

        const date = parseDateOnly(req.params.date);
        if (!date) {
            return res.status(400).json({ success: false, message: "Please provide a valid date." });
        }

        const slots = await DoctorSlot.find({
            doctorId: req.params.doctorId,
            date,
            status: "Available",
            isActive: true
        }).sort({
            startTime: 1
        });

        const now = new Date();
        const todayText = now.toISOString().slice(0, 10);
        const currentTime = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
        const futureSlots = slots.filter((slot) => {
            const slotDate = slot.date.toISOString().slice(0, 10);
            return slotDate > todayText || (slotDate === todayText && slot.startTime > currentTime);
        });

        res.status(200).json({
            success: true,
            slots: futureSlots
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};



exports.getMySlots = async (req, res) => {
    try {

        const selectedDate = parseDateOnly(req.params.date);
        if (!selectedDate) {
            return res.status(400).json({ success: false, message: "Please provide a valid date." });
        }

        const slots = await DoctorSlot.find({
            doctorId: req.user.id,
            date: selectedDate,
            isActive: true
        }).sort({
            startTime: 1
        });

        res.status(200).json({
            success: true,
            slots
        });

    }
    catch (error) {

        console.error("Get My Slots Error");

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    }
};


exports.blockSlot = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.slotId)) {
            return res.status(400).json({ success: false, message: "Invalid slot ID." });
        }

        const slot = await DoctorSlot.findOneAndUpdate(
            {
                _id: req.params.slotId,
                doctorId: req.user.id,
                status: "Available",
                isActive: true
            },
            {
                status: "Blocked"
            },
            {
                returnDocument: "after"
            }
        );

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: "Slot not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Slot blocked successfully.",
            slot
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


exports.unblockSlot = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.slotId)) {
            return res.status(400).json({ success: false, message: "Invalid slot ID." });
        }

        const slot = await DoctorSlot.findOneAndUpdate(
            {
                _id: req.params.slotId,
                doctorId: req.user.id,
                status: "Blocked",
                isActive: true
            },
            {
                status: "Available"
            },
            {
                returnDocument: "after"
            }
        );

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: "Slot not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Slot unblocked successfully.",
            slot
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
