const OpenApiUtil = require("../../util/OpenApiUtil");

const SCHEMA_DEFINITIONS_PATH = "#/definitions/";

/**
 * Extract only the model name of model reference.
 * 
 * @param {String} reference Model reference like '#/components/schemas/product'.
 * 
 * @returns {String} Model name.
 */
function getModelNameByReference(reference) {
    let path = reference.split("/");
    return path[path.length - 1];
}

/**
 * Replaces all swagger references to JSON schema references.
 * 
 * @param {Object} jsonSchema JSON schema object.
 * 
 * @returns {Object} JSON schema with references fixxed.
 */
function replaceSwaggerReferences(jsonSchema) {
    for (let property in jsonSchema) {
        let propertyDefinition = jsonSchema[property];

        /* In case of errors, replace this */
        if (property === OpenApiUtil.REFERENCE_KEYWORD) {
            jsonSchema[property] = fixJsonSchemaReference(propertyDefinition);
        } else if (OpenApiUtil.COMBINE_SCHEMAS_KEYWORDS.indexOf(property) >= 0) {
            for (let mr of OpenApiUtil.COMBINE_SCHEMAS_KEYWORDS) {
                if (property === mr) {
                    jsonSchema[property] = [];
                    for (let item of propertyDefinition) {
                        jsonSchema[property].push(fixJsonSchemaReference(item));
                    }
                }
            }
        } else if (OpenApiUtil.EXCLUDE_SCHEMA_KEYWORD === property) {
            console.info("Found exclusive swagger definition...");
            jsonSchema[OpenApiUtil.EXCLUDE_SCHEMA_KEYWORD] = fixJsonSchemaReference(propertyDefinition);
        } else if(typeof propertyDefinition === "object") {
            jsonSchema[property] = replaceSwaggerReferences(propertyDefinition);
        }
    }

    return jsonSchema;
}

/**
 * Fix a swagger reference, converting it to JSON schema reference.
 * 
 * @param {Object | String} refItem Model reference, like '#/components/schemas/error'.
 * 
 * @returns {Object | String} Reference to JSON schema model.
 */
function fixJsonSchemaReference(refItem) {
    if (typeof refItem === "string") {
        if (refItem.indexOf(SCHEMA_DEFINITIONS_PATH) < 0) {
            refItem = SCHEMA_DEFINITIONS_PATH + getModelNameByReference(refItem);
        }
    } else if (typeof refItem === "object" && refItem[OpenApiUtil.REFERENCE_KEYWORD]) {
        let reference = refItem[OpenApiUtil.REFERENCE_KEYWORD];
        if (reference.indexOf(SCHEMA_DEFINITIONS_PATH) < 0) {
            refItem[OpenApiUtil.REFERENCE_KEYWORD] = SCHEMA_DEFINITIONS_PATH + getModelNameByReference(reference);
        }
        return refItem;
    }

    return refItem;
}

module.exports = {
    getModelNameByReference: getModelNameByReference,
    replaceSwaggerReferences: replaceSwaggerReferences
};