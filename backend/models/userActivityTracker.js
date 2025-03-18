import mongoose from "mongoose";

const userActivityTracker = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    isLoggedinUser: {
      type: Boolean,
      default: false,
    },
    action: {
      type: String,
      enum: ["clicked", "buy", "viewed"],
      required: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    purchases: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const UserActivityTracker = mongoose.model("UserActivity", userActivityTracker);
export default UserActivityTracker;
