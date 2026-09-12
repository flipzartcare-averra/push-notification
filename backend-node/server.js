require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { connectDB } = require("./db/connect");
const cabsRouter = require("./routes/cabs");
const fareRouter = require("./routes/fare");
const bookingsRouter = require("./routes/bookings");
const searchRouter = require("./routes/search");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const adminRoutesRouter = require("./routes/adminRoutes");
const adminPackagesRouter = require("./routes/adminPackages");
const packagesRouter = require("./routes/packages");
const appVersionRouter = require("./routes/appVersion");
const adminAppConfigRouter = require("./routes/adminAppConfig");
const adminCabTypesRouter = require("./routes/adminCabTypes");
const distanceRouter = require("./routes/distance");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 4000;

// In production, set ALLOWED_ORIGIN to your deployed frontend's URL
// (e.g. https://averra.vercel.app). Left unset, this allows all
// origins, which is fine for local development only.
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "averra-backend-node" });
});

app.use("/api", cabsRouter);
app.use("/api/fare", fareRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/routes", searchRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin/routes", adminRoutesRouter);
app.use("/api/admin/packages", adminPackagesRouter);
app.use("/api/admin/app-config", adminAppConfigRouter);
app.use("/api/admin/cabtypes", adminCabTypesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/packages", packagesRouter);
app.use("/api/app-version", appVersionRouter);
app.use("/api/distance", distanceRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    console.error("Start MongoDB (see docker-compose.yml) or set MONGODB_URI, then retry.");
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Averra Node API listening on http://localhost:${PORT}`);
    console.log(
      `Fare requests are forwarded to ${process.env.JAVA_FARE_SERVICE_URL || "http://localhost:8080/api/fare/calculate"}`
    );
  });
}

start();
