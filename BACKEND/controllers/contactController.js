const ContactMessage = require("../models/ContactMessage");

exports.saveContactMessage = async (req, res) => {
    try {
        const name = req.body.name?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const phone = req.body.phone?.trim();
        const category = req.body.category?.trim();
        const subject = req.body.subject?.trim();
        const message = req.body.message?.trim();

        if (!name || !email || !phone || !category || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email address."
            });
        }

        const phonePattern = /^[6-9]\d{9}$/;
        if (!phonePattern.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number."
            });
        }

        const contactMessage = new ContactMessage({name, email, phone, category, subject, message});

        await contactMessage.save();

        res.status(201).json({
            success: true,
            message: "Message sent successfully."
        });
    }
    catch (error) {
        console.error("Contact Route Error:");
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};