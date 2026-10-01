import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

export const register = async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill in all fields." });
    }
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter a valid email." });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 6 characters.",
        });
    }

    if (await User.findOne({ email })) {
      return res
        .status(409)
        .json({
          success: false,
          message: "An account with this email already exists.",
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token: generateToken(user._id),
      user: userPayload(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill in all fields." });
    }

    const user = await User.findOne({ email });
    const isMatch = user && (await bcrypt.compare(password, user.password));
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token: generateToken(user._id),
      user: userPayload(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getCurrentUser = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};
