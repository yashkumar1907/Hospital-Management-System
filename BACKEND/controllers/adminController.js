const Admin = require("../models/Admin");

const bcrypt = require("bcryptjs");

const generateToken = require("../utils/generateToken");

exports.loginAdmin = async (req, res) => {
    try{
        const email = req.body.email?.trim().toLowerCase();
        const { password } = req.body;

        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:"Please fill all fields"
            });
        }

        const admin = await Admin.findOne({ email });

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
            return res.status(400).json({
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
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
};