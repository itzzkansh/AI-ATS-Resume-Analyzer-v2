import dns from "dns";
import "dotenv/config";
import connectDB from "./config/db.js";
import app from "./app.js";

// workaround for SRV DNS lookup problems on some local networks (not needed in production)
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

const PORT = process.env.PORT || 5000;

await connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
