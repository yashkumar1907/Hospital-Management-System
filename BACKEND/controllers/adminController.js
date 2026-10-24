const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const parseDateOnly = require("../utils/dateOnly");
const { getGrouping, buildTrendSeries } = require("../utils/appointmentTrendSeries");
const { buildQueueRows, getQueueStats } = require("../utils/appointmentQueue");

exports.loginAdmin = async (req, res) => {
    try{
        const email = req.body.email?.trim().toLowerCase();
        const {password} = req.body;

        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:"Please fill all fields"
            });
        }

        const admin = await Admin.findOne({ email }).select("+password");
        
        if(!admin){
            return res.status(404).json({
                success:false,
                message:"Admin not found"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            admin.password
        );

        if(!isPasswordCorrect){
            return res.status(401).json({
                success:false,
                message:"Invalid password"
            });
        }

        const adminData = {
            _id: admin._id,
            name: admin.name,
            email: admin.email
        };

        const token = generateToken(admin._id,"admin");

        res.status(200).json({
            success:true,
            message:"Login successful",
            admin:adminData,
            token
        });
    }

    catch(error){
        console.error("Admin Login Error");
    
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Appointment metrics use appointmentDate in [start, endExclusive); registered patients are unfiltered.
exports.getAnalytics = async (req, res) => {
    try {
        const start = parseDateOnly(req.query.start);
        const end = parseDateOnly(req.query.end);
        if (!start || !end || start > end) {
            return res.status(400).json({ success: false, message: "Provide a valid start and end date (YYYY-MM-DD), with start on or before end." });
        }
        const endExclusive = new Date(end);
        endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
        const match = { appointmentDate: { $gte: start, $lt: endExclusive } };
        const grouping = getGrouping(start, end);
        const dateFormat = grouping === "daily" ? "%Y-%m-%d" : "%Y-%m";
        const [registeredPatients, counts, trends, statuses, workload, recentAppointments] = await Promise.all([
            Patient.countDocuments(),
            Appointment.aggregate([
                { $match: match },
                { $group: { _id: null, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } }, cancelled: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } } } }
            ]),
            Appointment.aggregate([
                { $match: match },
                { $group: { _id: { $dateToString: { format: dateFormat, date: "$appointmentDate", timezone: "UTC" } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            Appointment.aggregate([
                { $match: match },
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            Appointment.aggregate([
                { $match: match },
                { $group: { _id: "$doctorId", doctorName: { $first: "$doctorName" }, count: { $sum: 1 } } },
                { $sort: { count: -1, doctorName: 1 } },
                { $limit: 10 }
            ]),
            Appointment.find(match).select("patientName doctorName appointmentDate appointmentTime status createdAt").sort({ createdAt: -1 }).limit(10).lean()
        ]);
        const totals = counts[0] || { total: 0, completed: 0, cancelled: 0 };
        const trendSeries = buildTrendSeries(start, end, trends.map((item) => ({ date: item._id, count: item.count })), grouping);
        res.status(200).json({
            success: true,
            period: { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), grouping },
            kpis: { registeredPatients, totalAppointments: totals.total, completedAppointments: totals.completed, cancellationRate: totals.total ? Number(((totals.cancelled / totals.total) * 100).toFixed(1)) : 0 },
            trends: trendSeries,
            statuses: statuses.map((item) => ({ status: item._id, count: item.count })),
            doctorWorkload: workload.map((item) => ({ doctorName: item.doctorName || "Unknown doctor", count: item.count })),
            recentAppointments: recentAppointments.map(({ patientName, doctorName, appointmentDate, appointmentTime, status }) => ({ patientName: patientName || "-", doctorName: doctorName || "-", appointmentDate, appointmentTime: appointmentTime || "-", status: status || "-" }))
        });
    } catch (error) {
        console.error("Admin Analytics Error");
        return res.status(500).json({ success: false, message: "Unable to load analytics." });
    }
};

exports.getPatientQueue = async (req, res) => {
    try {
        const selectedDate = parseDateOnly(req.query.date);
        if (!selectedDate) return res.status(400).json({ success: false, message: "Provide a valid queue date (YYYY-MM-DD)." });

        // Queue status is a display mapping of the existing appointment workflow status.
        const appointments = await Appointment.find({
            appointmentDate: selectedDate,
            status: { $in: ["Pending", "Confirmed", "Completed"] }
        }).select("patientName doctorName appointmentDate appointmentTime status createdAt")
            .sort({ appointmentTime: 1, createdAt: 1, _id: 1 }).lean();
        const queue = buildQueueRows(appointments);
        const stats = getQueueStats(queue);
        return res.status(200).json({ success: true, date: req.query.date, stats, queue });
    } catch (error) {
        console.error("Patient Queue Error");
        return res.status(500).json({ success: false, message: "Unable to load the patient queue." });
    }
};
