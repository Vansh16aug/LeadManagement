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
    },
    isLoggedinUser: {
      type: Boolean,
      default: false,
    },
    action: {
      type: String,
      enum: ["buy", "viewed", "added_to_cart", "account_created"],
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    purchases: {
      type: Number,
      default: 0,
    },
    cartAdds: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const UserActivityTracker = mongoose.model("UserActivity", userActivityTracker);
export default UserActivityTracker;
