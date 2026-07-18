const Doctor = require("../models/Doctor");
const DoctorSlot = require("../models/DoctorSlot");

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

        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found."
            });
        }

        const existingSlots = await DoctorSlot.find({
            doctorId,
            date: new Date(date)
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
                date: new Date(date),
                startTime: `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`,
                endTime: `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`
            });
        }

        await DoctorSlot.insertMany(slots);

        res.status(201).json({
            success: true,
            message: "Doctor slots generated successfully."
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAvailableSlots = async (req, res) => {
    try {
        const slots = await DoctorSlot.find({
            doctorId: req.params.doctorId,
            date: new Date(req.params.date),
            status: "Available",
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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


exports.blockSlot = async (req, res) => {
    try {
        const slot = await DoctorSlot.findByIdAndUpdate(
            req.params.slotId,
            {
                status: "Blocked"
            },
            {
                new: true
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
            message: error.message
        });
    }
};


exports.unblockSlot = async (req, res) => {
    try {
        const slot = await DoctorSlot.findByIdAndUpdate(
            req.params.slotId,
            {
                status: "Available"
            },
            {
                new: true
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
            message: error.message
        });
    }
};