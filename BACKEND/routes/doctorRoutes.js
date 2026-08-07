const express = require("express");

const {
    addDoctor,
    loginDoctor,
    getAllDoctors,
    getDoctorAppointments,
    updateAppointmentStatus,
    updateDoctor,
    updateDoctorByAdmin,
    deleteDoctor
} = require("../controllers/doctorController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const uploadImage = require("../middlewares/uploadImage");

const router = express.Router();



router.get("/test", (req, res) => {
    res.send("Doctor Route Working");
});


router.post("/add", authMiddleware, roleMiddleware("admin"), uploadImage.single("photo"), addDoctor);
router.post("/login", loginDoctor);
router.get("/all", getAllDoctors);
router.get("/appointments", authMiddleware, roleMiddleware("doctor"), getDoctorAppointments);
router.patch("/appointments/status/:id",authMiddleware, roleMiddleware("doctor", "admin"), updateAppointmentStatus);
router.put("/profile", authMiddleware, roleMiddleware("doctor"), uploadImage.single("photo"), updateDoctor);
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    uploadImage.single("photo"),
    updateDoctorByAdmin
);

router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteDoctor);


module.exports = router;