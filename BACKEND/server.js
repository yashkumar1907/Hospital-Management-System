const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const contactRoutes = require("./routes/contactRoutes");
const doctorSlotRoutes = require("./routes/doctorSlotRoutes");
const adminRoutes = require("./routes/adminRoutes");


const requiredEnvVars = [
    "MONGO_URI",
    "JWT_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
];

requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`${key} is missing in .env`);
    }
});

const app = express();

connectDB();


const allowedOrigins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://hospital-management-system-frontend-5ayy.onrender.com"
];


app.use(cors({
    origin: allowedOrigins,
    credentials:true
}));


app.use(express.json({ limit: "10mb" }));

app.use(express.urlencoded({
    extended: true,
    limit: "10mb"
}));

app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/doctor-slots", doctorSlotRoutes);
app.use("/api/admin", adminRoutes);


app.get("/", (req, res) => {
    res.send("🚀 HMS Backend Running");
});

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Backend is healthy."
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found."
    });
});

const multer = require("multer");

app.use((err, req, res, next) => {
    console.error("Global Error Handler:");
    console.error(err);

    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                message: "File size should be less than 2 MB."
            });
        }
    }

    if (err.message === "Only JPG, JPEG, PNG and WEBP images are allowed.") {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 HMS Backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});