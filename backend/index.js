// Packages
import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import UserActivityTracker from "./models/userActivityTracker.js";
import { authenticate } from "./middlewares/authMiddleware.js";
import { authorizeAdmin } from "./middlewares/authMiddleware.js";
import cors from "cors";
// Utils
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import sgMail from "@sendgrid/mail";
import cron from "node-cron";

dotenv.config();
const port = process.env.PORT || 5000;

connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.get("/api/users/leads", async (req, res) => {
  try {
    const activities = await UserActivityTracker.find()
      .populate("userId", "username email")
      .populate("productId", "name price category");

    return res.status(200).json(activities);
  } catch (error) {
    console.log(error);
    throw new Error("Invalid Data");
  }
});

app.use("/api/users", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/orders", orderRoutes);

app.get("/api/config/paypal", (req, res) => {
  res.send({ clientId: process.env.PAYPAL_CLIENT_ID });
});

const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname + "/uploads")));

// Set up SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Fetch users who abandoned their cart
const getAbandonedCartUsers = async () => {
  const abandonedCartUsers = await UserActivityTracker.aggregate([
    {
      $match: {
        action: "added_to_cart",
        purchases: 0, // Users who didn't purchase
      },
    },
    {
      $lookup: {
        from: "users", // The collection name for users
        localField: "userId",
        foreignField: "_id",
        as: "userData",
      },
    },
    {
      $lookup: {
        from: "products", // The collection name for products
        localField: "productId",
        foreignField: "_id",
        as: "productData",
      },
    },
    {
      $group: {
        _id: "$userId",
        email: { $first: "$userData.email" },
        username: { $first: "$userData.username" },
        productName: { $first: "$productData.name" },
        productImage: { $first: "$productData.image" },
        productPrice: { $first: "$productData.price" },
        productDescription: { $first: "$productData.description" },
        productId: { $first: "$productId" },
      },
    },
    {
      $project: {
        _id: 1,
        email: { $arrayElemAt: ["$email", 0] },
        username: { $arrayElemAt: ["$username", 0] },
        productName: { $arrayElemAt: ["$productName", 0] },
        productImage: { $arrayElemAt: ["$productImage", 0] },
        productPrice: { $arrayElemAt: ["$productPrice", 0] },
        productDescription: { $arrayElemAt: ["$productDescription", 0] },
        productId: 1,
      },
    },
  ]);

  return abandonedCartUsers;
};

// Fetch users who viewed a product more than 3 times
const getFrequentProductViewers = async () => {
  const frequentViewers = await UserActivityTracker.aggregate([
    {
      $match: {
        action: "viewed",
      },
    },
    {
      $group: {
        _id: { userId: "$userId", productId: "$productId" },
        viewCount: { $sum: 1 },
      },
    },
    {
      $match: {
        viewCount: { $gt: 3 }, // Users who viewed the product more than 3 times
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id.userId",
        foreignField: "_id",
        as: "userData",
      },
    },
    {
      $lookup: {
        from: "products", // The collection name for products
        localField: "_id.productId",
        foreignField: "_id",
        as: "productData",
      },
    },
    {
      $project: {
        _id: 0,
        userId: "$_id.userId",
        productId: "$_id.productId",
        viewCount: 1,
        email: { $arrayElemAt: ["$userData.email", 0] },
        username: { $arrayElemAt: ["$userData.username", 0] },
        productName: { $arrayElemAt: ["$productData.name", 0] },
        productImage: { $arrayElemAt: ["$productData.image", 0] },
        productPrice: { $arrayElemAt: ["$productData.price", 0] },
        productDescription: { $arrayElemAt: ["$productData.description", 0] },
      },
    },
  ]);

  console.log("Frequent product viewers:", frequentViewers);
  return frequentViewers;
};

// Fetch users who made a purchase
const getPurchaseData = async () => {
  const purchaseData = await UserActivityTracker.aggregate([
    {
      $match: {
        action: "buy", // Match users who made a purchase
      },
    },
    {
      $lookup: {
        from: "users", // The collection name for users
        localField: "userId",
        foreignField: "_id",
        as: "userData",
      },
    },
    {
      $lookup: {
        from: "products", // The collection name for products
        localField: "productId",
        foreignField: "_id",
        as: "productData",
      },
    },
    {
      $project: {
        _id: 0,
        userId: 1,
        productId: 1,
        email: { $arrayElemAt: ["$userData.email", 0] },
        username: { $arrayElemAt: ["$userData.username", 0] },
        productName: { $arrayElemAt: ["$productData.name", 0] },
        productImage: { $arrayElemAt: ["$productData.image", 0] },
        productPrice: { $arrayElemAt: ["$productData.price", 0] },
        productDescription: { $arrayElemAt: ["$productData.description", 0] },
      },
    },
  ]);

  console.log("Purchase data:", purchaseData);
  return purchaseData;
};

// Send email to abandoned cart users
const sendAbandonedCartEmail = async (user) => {
  try {
    const originalPrice = user.productPrice || 0;
    const discountPercentage = 10;
    const discountedPrice = originalPrice * (1 - discountPercentage / 100);

    const formattedOriginalPrice = `$${originalPrice.toFixed(2)}`;
    const formattedDiscountedPrice = `$${discountedPrice.toFixed(2)}`;

    const productImage =
      user.productImage || "https://your-store.com/default-product-image.jpg";

    const msg = {
      to: user.email,
      from: {
        name: "ECOMMERCE",
        email: "namasteji96@gmail.com",
      },
      subject: "🛒 Don't Miss Out! Your Cart is Waiting - 10% OFF Inside!",
      text: `Hi ${user.username}, we noticed you left ${user.productName} in your cart. Complete your purchase now and get 10% off!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            /* Add your email styles here */
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>YOUR CART IS WAITING!</h1>
            </div>
            <div class="content">
              <p class="greeting">Hi ${user.username || "there"},</p>
              <p>We noticed you left something special in your cart but didn't complete your purchase.</p>
              <div class="product-card">
                <img class="product-image" src="${productImage}" alt="${
        user.productName || "Product"
      }">
                <div class="product-details">
                  <h3 class="product-name">${
                    user.productName || "Your Selected Product"
                  }</h3>
                  <p class="product-description">${
                    user.productDescription ||
                    "This amazing product is perfect for your needs!"
                  }</p>
                  <div class="price-container">
                    <span class="original-price">${formattedOriginalPrice}</span>
                    <span class="discount-price">${formattedDiscountedPrice}</span>
                    <span class="discount-badge">SAVE ${discountPercentage}%</span>
                  </div>
                </div>
              </div>
              <div class="cta-container">
                <a href="https://your-store.com/cart" class="cta-button">Complete My Purchase</a>
              </div>
              <p>Happy shopping!</p>
              <p>The Your Store Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    console.log("Sending email to:", user.email);
    await sgMail.send(msg);
    console.log("Email sent successfully to:", user.email);
  } catch (error) {
    console.error("Error sending email:", error);
    if (error.response) {
      console.error("SendGrid error response:", error.response.body);
    }
  }
};

// Send email to frequent product viewers
const sendFrequentViewerEmail = async (user) => {
  try {
    const originalPrice = user.productPrice || 0;
    const discountPercentage = 10;
    const discountedPrice = originalPrice * (1 - discountPercentage / 100);

    const formattedOriginalPrice = `$${originalPrice.toFixed(2)}`;
    const formattedDiscountedPrice = `$${discountedPrice.toFixed(2)}`;

    const productImage =
      user.productImage || "https://your-store.com/default-product-image.jpg";

    const msg = {
      to: user.email,
      from: {
        name: "ECOMMERCE",
        email: "namasteji96@gmail.com",
      },
      subject: "🌟 Special Offer Just for You!",
      text: `Hi ${user.username}, we noticed you're interested in ${user.productName}. Here's a special offer just for you!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            /* Add your email styles here */
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SPECIAL OFFER JUST FOR YOU!</h1>
            </div>
            <div class="content">
              <p class="greeting">Hi ${user.username || "there"},</p>
              <p>We noticed you're interested in ${
                user.productName
              }. Here's a special offer just for you!</p>
              <div class="product-card">
                <img class="product-image" src="${productImage}" alt="${
        user.productName || "Product"
      }">
                <div class="product-details">
                  <h3 class="product-name">${
                    user.productName || "Your Selected Product"
                  }</h3>
                  <p class="product-description">${
                    user.productDescription ||
                    "This amazing product is perfect for your needs!"
                  }</p>
                  <div class="price-container">
                    <span class="original-price">${formattedOriginalPrice}</span>
                    <span class="discount-price">${formattedDiscountedPrice}</span>
                    <span class="discount-badge">SAVE ${discountPercentage}%</span>
                  </div>
                </div>
              </div>
              <div class="cta-container">
                <a href="https://your-store.com/cart" class="cta-button">Complete My Purchase</a>
              </div>
              <p>Happy shopping!</p>
              <p>The Your Store Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    console.log("Sending email to:", user.email);
    await sgMail.send(msg);
    console.log("Email sent successfully to:", user.email);
  } catch (error) {
    console.error("Error sending email:", error);
    if (error.response) {
      console.error("SendGrid error response:", error.response.body);
    }
  }
};

// Send email to users who made a purchase
const sendPurchaseConfirmationEmail = async (user) => {
  try {
    // Debug the user object to understand its structure
    console.log(
      "User data for purchase confirmation:",
      JSON.stringify(user, null, 2)
    );

    const productImage =
      user.productImage || "https://your-store.com/default-product-image.jpg";

    // Fix: Use default value if productPrice is undefined
    const productPrice = user.productPrice || 0;

    const msg = {
      to: user.email,
      from: {
        name: "ECOMMERCE",
        email: "namasteji96@gmail.com",
      },
      subject: "🎉 Thank You for Your Purchase!",
      text: `Hi ${user.username}, thank you for purchasing ${user.productName}. Here are the details of your order.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            /* Add your email styles here */
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>THANK YOU FOR YOUR PURCHASE!</h1>
            </div>
            <div class="content">
              <p class="greeting">Hi ${user.username || "there"},</p>
              <p>Thank you for purchasing <strong>${
                user.productName || "your product"
              }</strong>. We're excited for you to enjoy your new product!</p>
              <div class="product-card">
                <img class="product-image" src="${productImage}" alt="${
        user.productName || "Product"
      }">
                <div class="product-details">
                  <h3 class="product-name">${
                    user.productName || "Your Purchased Product"
                  }</h3>
                  <p class="product-description">${
                    user.productDescription ||
                    "This amazing product is perfect for your needs!"
                  }</p>
                  <div class="price-container">
                    <span class="price">$${productPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <p>If you have any questions about your order, feel free to contact us.</p>
              <p>Happy shopping!</p>
              <p>The ECOMMERCE Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    console.log("Sending purchase confirmation email to:", user.email);
    await sgMail.send(msg);
    console.log(
      "Purchase confirmation email sent successfully to:",
      user.email
    );
  } catch (error) {
    console.error("Error sending purchase confirmation email:", error);
    if (error.response) {
      console.error("SendGrid error response:", error.response.body);
    }
  }
};

// Run abandoned cart recovery
const runAbandonedCartRecovery = async () => {
  const abandonedCartUsers = await getAbandonedCartUsers();

  for (const user of abandonedCartUsers) {
    await sendAbandonedCartEmail(user);
  }
};

// Run frequent viewer campaign
const runFrequentViewerCampaign = async () => {
  const frequentViewers = await getFrequentProductViewers();

  for (const user of frequentViewers) {
    await sendFrequentViewerEmail(user);
  }
};

// Trigger purchase confirmation email
const triggerPurchaseConfirmationEmail = async () => {
  try {
    const purchaseData = await getPurchaseData();
    console.log(`Found ${purchaseData.length} purchases to confirm`);

    for (const user of purchaseData) {
      await sendPurchaseConfirmationEmail(user);
    }
  } catch (error) {
    console.error("Error in triggerPurchaseConfirmationEmail:", error);
  }
};

// Schedule the automation for abandoned cart recovery
cron.schedule("53 9 * * *", () => {
  console.log(
    "Abandoned cart recovery cron job triggered at:",
    new Date().toLocaleString()
  );
  runAbandonedCartRecovery();
});

// Schedule the automation for frequent viewer campaign
cron.schedule("0 9 * * *", () => {
  console.log(
    "Frequent viewer campaign cron job triggered at:",
    new Date().toLocaleString()
  );
  runFrequentViewerCampaign();
});

// Schedule the automation for purchase confirmation emails
cron.schedule("24 10 * * *", () => {
  console.log(
    "Purchase confirmation cron job triggered at:",
    new Date().toLocaleString()
  );
  triggerPurchaseConfirmationEmail();
});

// Trigger purchase confirmation email on order creation
app.post("/api/orders", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    // Create the order
    const order = await Order.create({ userId, productId });

    // Track the purchase action
    await UserActivityTracker.create({
      userId,
      productId,
      action: "buy",
      purchases: 1,
    });

    // Trigger purchase confirmation email
    await triggerPurchaseConfirmationEmail();

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(port, () => console.log(`Server running on port: ${port}`));
