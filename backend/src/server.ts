import "dotenv/config";
import app from "./app";
import { loadApplicationStates } from "./config/STATE";

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    await loadApplicationStates();
    console.log("Application states loaded successfully.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Critical error during server startup:", error);
    process.exit(1); 
  }
}

startServer();