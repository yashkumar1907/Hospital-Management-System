const express = require("express");
const cors = require("cors");

const dotenv = require("dotenv");

const connectDB = require("./config/db");

const path = require("path");

const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const contactRoutes = require("./routes/contactRoutes");
const doctorSlotRoutes = require("./routes/doctorSlotRoutes");
const adminRoutes = require("./routes/adminRoutes");

dotenv.config();

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in .env");
}

const app = express();

connectDB();

app.use(cors({
    origin: [
        "http://localhost:5500",
        "http://127.0.0.1:5500"
    ],
    credentials: true
}));


app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/doctor-slots", doctorSlotRoutes);
app.use("/api/admin", adminRoutes);


app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
    res.send("HMS Backend Running");
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found."
    });
});



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});