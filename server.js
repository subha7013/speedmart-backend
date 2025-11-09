import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";

import User from "./models/User.js";
import Order from "./models/Order.js";
import { requireAuth } from "./middleware/requireAuth.js";

// -------------------- APP INIT --------------------
const app = express();
app.use(express.json());
app.use(cookieParser());

// Allow frontend (your netlify site) to access backend
app.use(cors({
  origin: "https://speedmart-order.netlify.app", // your frontend domain
  credentials: true
}));

// -------------------- STATIC FILES (if needed locally) --------------------
app.use(express.static("../frontend"));

// -------------------- DB CONNECT --------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));


// -------------------- AUTH ROUTES --------------------
app.post("/api/register", async (req, res) => {
  const { email, phone, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.json({ ok: false, msg: "Email already used" });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, phone, passwordHash: hash });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.cookie("token", token, { httpOnly: true, sameSite: "none", secure: true });
  res.json({ ok: true });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ ok: false });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.json({ ok: false });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.cookie("token", token, { httpOnly: true, sameSite: "none", secure: true });
  res.json({ ok: true });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "none", secure: true });
  res.json({ ok: true });
});

app.get("/api/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select("email");
  res.json({ ok: true, email: user.email });
});


// -------------------- ORDERS --------------------
app.get("/api/orders", requireAuth, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json({ ok: true, orders });
});

app.post("/api/checkout", requireAuth, async (req, res) => {
  const { items, total } = req.body;

  if (!items || items.length === 0) {
    return res.json({ ok: false, msg: "Cart is empty" });
  }

  const order = await Order.create({
    userId: req.user.id,
    items,
    total
  });

  res.json({ ok: true, order });
});


// -------------------- START SERVER --------------------
app.listen(process.env.PORT || 8080, () =>
  console.log("✅ Backend Running on Port", process.env.PORT || 8080)
);
