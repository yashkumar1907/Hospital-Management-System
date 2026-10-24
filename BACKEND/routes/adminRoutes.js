const express = require("express");
const router = express.Router();

const { loginAdmin, getAnalytics, getPatientQueue } = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.post("/login", loginAdmin);
router.get("/analytics", authMiddleware, roleMiddleware("admin"), getAnalytics);
router.get("/queue", authMiddleware, roleMiddleware("admin"), getPatientQueue);

module.exports = router;
