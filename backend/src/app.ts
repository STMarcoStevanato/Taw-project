import express from "express";
import cors from "cors";
import routes from "./routes";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { pool } from "./config/db";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({
  origin: ["http://localhost:4200", "http://localhost:3000"], 
  credentials: true                
}));

app.use(express.json());
app.use(cookieParser());
app.use("/", routes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

export default app;