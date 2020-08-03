const EndpointService = require('../services/SwaggerEndpointService');
const SchemaService = require('../services/SchemaService');
const StorageService = require('../services/SwaggerStorageService');

module.exports = {
    /**
     * Create JSON schema to request and responses of one endpoint.
     * 
     * @param {*} req Request.
     * @param {*} res Response.
     */
    getEndpointSchemas(req, res) {
        const swaggerId = req.params.swaggerId;
        const endpointId = req.params.endpointId;

        // Load swagger
        const swagger = StorageService.findSwaggerById(swaggerId);
        if (swagger === null) {
            return res.status(404).json({ message: "Swagger file not found!" });
        }

        // Load endpoint
        let endpoint = EndpointService.findEndpointById(swagger, endpointId);
        if (endpoint === null) {
            return res.status(404).json({ message: "Swagger endpoint not found!" });
        }
        endpoint = EndpointService.cleanEndpoint(endpoint);

        const endpointSchemas = SchemaService.createEndpointSchemas(endpoint, swagger);
        return res.status(200).json(endpointSchemas);
    }
};