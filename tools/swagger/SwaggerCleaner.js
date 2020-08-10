/**
 * Remove non necessary informations of swagger.
 * 
 * @param {Object} swagger Open API 3 swagger.
 * 
 * @returns {Object} Swagger without the unnecessary informations.
 */
function cleanSwagger(swagger) {
    delete swagger.openapi;
    delete swagger.info;
    delete swagger.servers;
    return swagger;
}

/**
 * Remove non necessary informations of endpoint.
 * 
 * @param {Object} endpoint Endpoint of a swagger 3.
 * 
 * @returns {Object} Endpoint without the unnecessary informations.
 */
function cleanEndpoint(endpoint) {
    delete endpoint.summary;
    delete endpoint.tags;
    delete endpoint.parameters;
    return endpoint;
}

module.exports.cleanSwagger = cleanSwagger;
module.exports.cleanEndpoint = cleanEndpoint;