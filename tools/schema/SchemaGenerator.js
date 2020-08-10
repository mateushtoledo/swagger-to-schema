const ReferenceTool = require("./ReferenceTool");
const PropertyConverter = require("./PropertyConverter");

/**
 * Build the json schema validation using the base structure and the models used in the request/response.
 * 
 * @param {Object} reqResContent Content of request or response, defined in swagger.
 * @param {Object} finalModels All models necessary to json schema. Key value object, mapping ModelReference => ModelDefinition.
 * 
 * @returns {Object} JSON schema validation.
 */
function buildJsonSchema(reqResContent, finalModels) {
    let schemaSkeleton = {
        "$schema": "http://json-schema.org/draft-07/schema#"
    };

    // Create model definitions: {definitions: {}}
    for (let name in finalModels) {
        let modelName = ReferenceTool.getModelNameByReference(name);
        if (!schemaSkeleton.definitions) {
            schemaSkeleton.definitions = {};
        }
        schemaSkeleton.definitions[modelName] = finalModels[name];
    }

    // Build final Schema
    let jsonSchema = mergeSchemaStructureWithJsonContent(schemaSkeleton, reqResContent);
    return ReferenceTool.replaceSwaggerReferences(jsonSchema);
}

/**
 * Add content of request/response into JSON schema.
 * 
 * @param {Object} schemaSkeleton Start of json schema (schema missing some details).
 * @param {Object} reqResContent Content of request or response (swagger application/json schema).
 * 
 * @returns {Object} JSON schema structure.
 */
function mergeSchemaStructureWithJsonContent(schemaSkeleton, reqResContent) {
    let bodySchema = PropertyConverter.mapObjectToSchema(reqResContent);
    return {...schemaSkeleton, ...bodySchema};
}

module.exports = {
    buildJsonSchema: buildJsonSchema
}