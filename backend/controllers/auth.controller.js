import User from "../models/user.model.js";

export const signUp = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "The email already exists" });
    }
    const user = await User.create({ name, email, password });
    return res.status(201).json({ message: "User created successfully", user });
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
