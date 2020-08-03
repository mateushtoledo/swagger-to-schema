const REFERENCE_KEYWORD = "$ref";
const REFERENCE_KEYWORDS = ["$ref", "not", "oneOf", "allOf", "anyOf", "not"];
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
        if (REFERENCE_KEYWORDS.indexOf(property) >= 0) {
            if (propertyDefinition instanceof Array) {
                let fixxedReferences = [];
                for (let item of propertyDefinition) {
                    fixxedReferences.push(fixJsonSchemaReference(item, true));
                }
                jsonSchema[property] = fixxedReferences;
            } else {
                jsonSchema[property] = fixJsonSchemaReference(propertyDefinition);
            }
        } else if (typeof propertyDefinition === 'object') {
            jsonSchema[property] = replaceSwaggerReferences(propertyDefinition);
        }
    }

    return jsonSchema;
}

/**
 * Fix a swagger reference, converting it to JSON schema reference.
 * 
 * @param {Object | String} refItem Model reference, like '#/components/schemas/error'.
 * @param {Boolean} returnObject Return the fixxed reference as a object?
 * 
 * @returns {Object | String} Reference to JSON schema model.
 */
function fixJsonSchemaReference(refItem, returnObject = false) {
    if (typeof refItem === "string") {
        if (refItem.indexOf(SCHEMA_DEFINITIONS_PATH) < 0) {
            refItem = SCHEMA_DEFINITIONS_PATH + getModelNameByReference(refItem);
        }
    } else if (typeof refItem === "object" && refItem[REFERENCE_KEYWORD]) {
        let reference = refItem[REFERENCE_KEYWORD];
        if (reference.indexOf(SCHEMA_DEFINITIONS_PATH) < 0) {
            refItem[REFERENCE_KEYWORD] = SCHEMA_DEFINITIONS_PATH + getModelNameByReference(reference);
        }
        return refItem;
    }

    return returnObject ? { "$ref": refItem } : refItem;
}

module.exports = {
    getModelNameByReference: getModelNameByReference,
    replaceSwaggerReferences: replaceSwaggerReferences
};