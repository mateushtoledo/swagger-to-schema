const ReferenceTool = require("./ReferenceTool");
const PropertyConverter = require("./PropertyConverter");
const JsonDebugger = require("../json/JsonDebugger");
const REFERENCE_KEYWORD = "$ref";
const SWAGGER_DEFINITIONS_PATH = "#/definitions/";

/**
 * Build the json schema validation using the base structure and the models used in the request/response.
 * 
 * @param {Object} schemaBaseStructure Base structure of json schema, created at DataExtractor.buildSchemaBaseStructure.
 * @param {Object} finalModels All models necessary to json schema. Key value object, mapping ModelReference => ModelDefinition.
 * 
 * @returns {Object} JSON schema validation.
 */
function buildJsonSchema(schemaBaseStructure, finalModels) {
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
    let jsonSchema = addBaseStructureDetailsToSchema(schemaSkeleton, schemaBaseStructure);
    return ReferenceTool.replaceSwaggerReferences(jsonSchema);
}

/**
 * Add the details present in the base structure of request/response into JSON schema.
 * 
 * @param {Object} schemaSkeleton Start of json schema (schema missing some details).
 * @param {Object} schemaBaseStructure Base structure of json schema, created at DataExtractor.buildSchemaBaseStructure.
 * 
 * @returns {Object} JSON schema structure.
 */
function addBaseStructureDetailsToSchema(schemaSkeleton, schemaBaseStructure) {
    const referenceType = schemaBaseStructure.refType;
    if (referenceType === "single") {
        if (schemaBaseStructure.body !== null) {
            // Convert object swagger to JSON schema
            let bodySchema = PropertyConverter.mapObjectToSchema(schemaBaseStructure.body);
            // Object merge
            schemaSkeleton = {...schemaSkeleton, ...bodySchema};
        } else {
            schemaSkeleton[REFERENCE_KEYWORD] = SWAGGER_DEFINITIONS_PATH + ReferenceTool.getModelNameByReference(schemaBaseStructure.references[0]);
        }
    } else {
        schemaSkeleton[referenceType] = [];
        for (let reference of schemaBaseStructure.references) {
            let modelReference = {};
            modelReference[REFERENCE_KEYWORD] = SWAGGER_DEFINITIONS_PATH + ReferenceTool.getModelNameByReference(reference);
            schemaSkeleton[referenceType].push(modelReference);
        }
    }

    return schemaSkeleton;
}

module.exports = {
    buildJsonSchema: buildJsonSchema
}