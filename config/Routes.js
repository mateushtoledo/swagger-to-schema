const express = require('express');
const routes = express.Router();

const EndpointController = require('../controllers/EndpointController');
const SchemaController = require('../controllers/SchemaController');
const SwaggerController = require('../controllers/SwaggerController');

routes.post("/swaggers", SwaggerController.uploadSwagger);
routes.get("/swaggers/:swaggerId/endpoints", EndpointController.getSwaggerEndpoints);
routes.get("/swaggers/:swaggerId/endpoints/:endpointId/schemas", SchemaController.getEndpointSchemas);

module.exports = routes;