import express from "express";
import mongoose from "mongoose";
import sgMail from "@sendgrid/mail";
import cron from "node-cron";

// Initialize Express
const app = express();
const PORT = 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

// Set up SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// UserActivity Model (assuming it's already defined)
const UserActivity = mongoose.model("UserActivity", userActivityTracker);

// Fetch users who abandoned their cart
const getAbandonedCartUsers = async () => {
  const abandonedCartUsers = await UserActivity.aggregate([
    {
      $match: {
        action: "added_to_cart",
        purchases: 0, // Users who didn't purchase
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Added to cart more than 24 hours ago
      },
    },
    {
      $group: {
        _id: "$userId",
        email: { $first: "$userId.email" },
        username: { $first: "$userId.username" },
        productName: { $first: "$productId.name" },
      },
    },
  ]);

  return abandonedCartUsers;
};

// Send email to abandoned cart users
const sendAbandonedCartEmail = async (user) => {
  const msg = {
    to: "kumarvansh16aug@gmail.com",
    from: "vansh16805@gmail.com", // Your verified SendGrid email
    subject: "Complete Your Purchase!",
    text: `Hi ${user.username}, we noticed you left something in your cart. Complete your purchase now and get 10% off!`,
    html: `<p>Hi ${user.username},</p>
           <p>We noticed you left <strong>${user.productName}</strong> in your cart.</p>
           <p>Complete your purchase now and get <strong>10% off</strong>!</p>`,
  };

  await sgMail.send(msg);
};

// Run abandoned cart recovery
const runAbandonedCartRecovery = async () => {
  const abandonedCartUsers = await getAbandonedCartUsers();

  for (const user of abandonedCartUsers) {
    await sendAbandonedCartEmail(user);
    console.log(`Email sent to ${user.email}`);
  }
};

// Schedule the automation (runs every day at 9 AM)
cron.schedule("0 9 * * *", () => {
  console.log("Running abandoned cart recovery...");
  runAbandonedCartRecovery();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
