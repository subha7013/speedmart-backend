import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{ name: String, price: Number, qty: Number }],
  total: Number,
  status: { type: String, default: "PLACED" }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);

