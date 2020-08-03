const { v4: uuidv4 } = require('uuid');
const HttpUtil = require("../util/HttpUtil");
const SwaggerCleaner = require("../tools/swagger/SwaggerCleaner");

module.exports = {
    
    assignIdToEndpoints(swagger) {
        if (swagger.paths) {
            for (let path in swagger.paths) {
                for (let httpMethod in swagger.paths[path]) {
                    swagger.paths[path][httpMethod].id = uuidv4();
                }
            }
        }

        return swagger;
    },

    findEndpointById(swagger, endpointId) {
        if (swagger.paths) {
            for (let path in swagger.paths) {
                for (let httpMethod in swagger.paths[path]) {
                    if (swagger.paths[path][httpMethod].id == endpointId) {
                        return swagger.paths[path][httpMethod];
                    }
                }
            }
        }

        return null;
    },

    extractEndpoints(swagger) {
        let paths = [];

        if (swagger.paths) {
            for (let path in swagger.paths) {
                for (let httpMethod in swagger.paths[path]) {
                    if (HttpUtil.isValidHttpMethod(httpMethod)) {
                        let endpointId = swagger.paths[path][httpMethod].id;
                        paths.push({
                            id: endpointId,
                            method: httpMethod.toUpperCase(),
                            path: path,
                            _links: {
                                _schema: process.env.BASE_URL + `${swagger.id}/endpoints/${endpointId}/schemas`
                            }
                        });
                    }
                }
            }
        }

        return paths;
    },

    cleanEndpoint(endpointDefinition) {
        return SwaggerCleaner.cleanEndpoint(endpointDefinition);
    }
};