const express = require("express");

const {addDoctor, loginDoctor, getAllDoctors, getDoctorAppointments, updateAppointmentStatus, updateDoctor, deleteDoctor} = require("../controllers/doctorController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const multer = require("multer");
const path = require("path");

const router = express.Router();


const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"uploads/doctors");
    },

    filename:(req,file,cb)=>{
        cb(null, Date.now() + path.extname(file.originalname)
        );
    }
});

const upload = multer({storage});


router.get("/test", (req, res) => {
    res.send("Doctor Route Working");
});


router.post("/add", authMiddleware, roleMiddleware("admin"), upload.single("photo"), addDoctor);
router.post("/login", loginDoctor);
router.get("/all", getAllDoctors);
router.get("/appointments", authMiddleware, roleMiddleware("doctor"), getDoctorAppointments);
router.patch("/appointments/status/:id",authMiddleware, roleMiddleware("doctor"), updateAppointmentStatus);
router.put("/profile", authMiddleware, roleMiddleware("doctor"), updateDoctor);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteDoctor);


module.exports = router;