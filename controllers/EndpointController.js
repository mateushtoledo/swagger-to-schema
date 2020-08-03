const EndpointService = require('../services/SwaggerEndpointService');
const StorageService = require('../services/SwaggerStorageService');

module.exports = {
    /**
     * Return all endpoints of swagger.
     * 
     * @param {*} req Request.
     * @param {*} res Response.
     */
    getSwaggerEndpoints(req, res) {
        const swaggerId = req.params.swaggerId;

        const swagger = StorageService.findSwaggerById(swaggerId);
        if (swagger == null) {
            return res.status(404).json({ message: "Swagger file not found!" });
        }

        const endpoints = EndpointService.extractEndpoints(swagger);
        return res.status(200).json(endpoints);
    }
};