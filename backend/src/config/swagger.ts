import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Overseas program Management API",
      version: "1.0.0",
      description: "Official API documentation with JWT authentication via cookies and CSRF protection",
    },
    servers: [
      {
        url: "http://localhost:3000", 
        description: "Local Development Server",
      },
    ],
    
    components: {
      securitySchemes: {
        XSRFToken: {
          type: "apiKey",
          in: "header",
          name: "X-XSRF-TOKEN",
          description: "Enter the value of the XSRF-TOKEN cookie here for POST/PUT/DELETE requests",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"], 
};

export const swaggerSpec = swaggerJSDoc(options);