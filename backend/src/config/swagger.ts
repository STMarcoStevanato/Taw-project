import { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { getOpenApiDocumentation } from "./openapi";
import "../schemas/index.path"; 

export const setupSwagger = (app: Application): void => {
  const openApiDocument = getOpenApiDocumentation();

  const swaggerOptions = {
    swaggerOptions: {
      withCredentials: true,
    },
  };

  app.use(
    "/api-docs", 
    swaggerUi.serve, 
    swaggerUi.setup(openApiDocument, swaggerOptions)
  );

  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(openApiDocument);
  });

  console.log("Swagger UI on http://localhost:3000/api-docs");
};