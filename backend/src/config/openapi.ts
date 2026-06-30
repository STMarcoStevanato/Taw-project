import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z as zodBase } from "zod";


extendZodWithOpenApi(zodBase);


export { zodBase as z };

export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "XSRFToken", {
  type: "apiKey",
  in: "header",        
  name: "X-XSRF-TOKEN", 
  description: "Enter the CSRF token you received during login",
});

export const getOpenApiDocumentation = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "School Management API",
      description: "Backend API documented natively via TypeScript and Zod",
    },
    servers: [{ url: "http://localhost:3000" }],
  });
};