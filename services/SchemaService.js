const DataExtractor = require("../tools/swagger/DataExtractor");
const JsonContentTool = require("../tools/swagger/JsonContentTool");
const SchemaGenerator = require("../tools/schema/SchemaGenerator");
const PropertyConverter = require("../tools/schema/PropertyConverter");
const OpenApiUtil = require("../util/OpenApiUtil");

function createModelSchemas(models) {
    let modelSchemas = {};

    for (let modelName in models) {
        modelSchemas[modelName] = PropertyConverter.mapObjectToSchema(models[modelName]);
    }

    return modelSchemas;
}

function getJsonSchema(swagger, swaggerJsonContent) {
    // Get JSON content of request/response
    let itemStructure = JsonContentTool.getJsonContent(swaggerJsonContent, swagger);

    // Load the models used into this content
    let usedModels = DataExtractor.extractModels(swagger, swaggerJsonContent);
    let allModelsUsed = DataExtractor.recursiveModelExtract(swagger, usedModels, usedModels);


    // Create schema of all models, and use it to create JSON schema
    let modelSchemas = createModelSchemas(allModelsUsed);
    return SchemaGenerator.buildJsonSchema(itemStructure, modelSchemas);
}

function createSchemaOfResponses(responses, swagger) {
    let schemasOfResponses = [];

    // Create schema of all responses with json content
    for (let responseCode in responses) {
        let endpointResponseDefinition = responses[responseCode];
        if (JsonContentTool.haveJsonContent(endpointResponseDefinition, swagger)) {
            // If it's only a reference to response, extract the content
            if (endpointResponseDefinition[OpenApiUtil.REFERENCE_KEYWORD]) {
                endpointResponseDefinition = DataExtractor.extractModel(endpointResponseDefinition[OpenApiUtil.REFERENCE_KEYWORD], swagger);
            }

            // Create JSON schema of this response
            schemasOfResponses.push({
                code: responseCode,
                schema:  getJsonSchema(swagger, endpointResponseDefinition)
            });
        }
    }

    return schemasOfResponses;
}

function createEndpointSchemas(endpoint, swagger) {
    let endpointSchema = {};

    // Create request body schema?
    if (endpoint.requestBody && JsonContentTool.haveJsonContent(endpoint.requestBody, swagger)) {
        endpointSchema.request = getJsonSchema(swagger, endpoint.requestBody);
    }

    // Create schema to all responses with json content
    if (endpoint.responses) {
        let schemasOfResponses = createSchemaOfResponses(endpoint.responses, swagger);
        if (schemasOfResponses.length > 0) {
            endpointSchema.responses = schemasOfResponses;
        }
    }

    return endpointSchema;
}

module.exports = {
    createEndpointSchemas: createEndpointSchemas
};