module.exports = {
    cleanSwagger(swagger) {
        delete swagger.openapi;
        delete swagger.info;
        delete swagger.servers;
        return swagger;
    },

    cleanEndpoint(endpoint) {
        delete endpoint.summary;
        delete endpoint.tags;
        delete endpoint.parameters;
        return endpoint;
    }
}