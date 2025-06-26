const express = require("express");
const cors = require("cors");

const uploadRoutes = require("./routes/upload");
const deleteRoutes = require("./routes/delete"); // 👈 tilføjet

const app = express();
app.use(cors());
app.use(express.json());

// Ruter
app.use("/upload", uploadRoutes);   // fx POST /upload, GET /upload, POST /upload/compare
app.use("/delete", deleteRoutes);   // fx DELETE /delete/all

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on http://0.0.0.0:${PORT}`);
});

