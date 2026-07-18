const express = require("express");
const router = express.Router();

const {generateSlots, getAvailableSlots, blockSlot, unblockSlot} = require("../controllers/doctorSlotController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");


router.post("/generate", authMiddleware, roleMiddleware("doctor"), generateSlots);
router.get("/available/:doctorId/:date", getAvailableSlots);
router.patch("/block/:slotId", authMiddleware, roleMiddleware("doctor"), blockSlot);
router.patch("/unblock/:slotId", authMiddleware, roleMiddleware("doctor"), unblockSlot);


module.exports = router;