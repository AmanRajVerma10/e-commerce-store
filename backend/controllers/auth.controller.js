import User from "../models/user.model.js";
import { redis } from "../lib/redis.js";
import jwt from "jsonwebtoken";

const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (id, refreshToken) => {
  await redis.set(`refreshToken:${id}`, refreshToken, "EX", 7 * 24 * 60 * 60);
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const signUp = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "The email already exists" });
    }
    const user = await User.create({ name, email, password });
    const { accessToken, refreshToken } = generateTokens(user._id);
    storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);
    return res
      .status(201)
      .json({
        message: "User created successfully",
        user: {
          _id: user._id,
          name: user.name,
          role: user.role,
          email: user.email,
        },
      });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const isMatch = await user.comparePasswords(password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  return res.status(200).json({ message: "Login successful", user });
};

export const logout = async (req, res) => {};
