import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Please provide a name"] },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minLength: 6,
    },
    cartItems: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
      },
    ],
    role: { type: String, enum: ["admin", "customer"], default: "customer" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePasswords = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
