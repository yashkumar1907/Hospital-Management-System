const express = require("express");
const router = express.Router();

const {registerPatient, loginPatient, bookAppointment, getPatientAppointments, updateProfile, getAllPatients, deletePatient, getAllAppointments} = require("../controllers/patientController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");


router.get("/test", (req,res)=>{
    res.send("Patient Route Working");
});


router.post("/register", registerPatient);
router.post("/login", loginPatient);
router.post("/book-appointment",authMiddleware,roleMiddleware("patient"), bookAppointment);
router.get("/appointments", authMiddleware,roleMiddleware("patient"), getPatientAppointments);
router.put("/profile", authMiddleware,roleMiddleware("patient"), updateProfile);
router.get("/all",authMiddleware, roleMiddleware("admin"), getAllPatients);
router.delete("/:id",authMiddleware, roleMiddleware("admin"), deletePatient);
router.get("/all-appointments",authMiddleware, roleMiddleware("admin"), getAllAppointments);

module.exports = router;