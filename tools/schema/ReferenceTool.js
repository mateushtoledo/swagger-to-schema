const REFERENCE_KEYWORD = "$ref";
const MULTIPLE_REFERENCE_KEYWORDS = ["oneOf", "allOf", "anyOf"];
const EXCLUSIVE_REFERENCE_KEYWORD = "not";
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
        if (property === REFERENCE_KEYWORD) {
            jsonSchema[property] = fixJsonSchemaReference(propertyDefinition);
        } else if (MULTIPLE_REFERENCE_KEYWORDS.indexOf(property) >= 0) {
            for (let mr of MULTIPLE_REFERENCE_KEYWORDS) {
                if (property === mr) {
                    jsonSchema[property] = [];
                    for (let item of propertyDefinition) {
                        jsonSchema[property].push(fixJsonSchemaReference(item));
                    }
                }
            }
        } else if (EXCLUSIVE_REFERENCE_KEYWORD === property) {
            console.info("Found exclusive swagger definition...");
            jsonSchema[EXCLUSIVE_REFERENCE_KEYWORD] = fixJsonSchemaReference(propertyDefinition);
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
    } else if (typeof refItem === "object" && refItem[REFERENCE_KEYWORD]) {
        let reference = refItem[REFERENCE_KEYWORD];
        if (reference.indexOf(SCHEMA_DEFINITIONS_PATH) < 0) {
            refItem[REFERENCE_KEYWORD] = SCHEMA_DEFINITIONS_PATH + getModelNameByReference(reference);
        }
        return refItem;
    }

    return refItem;
}

module.exports = {
    getModelNameByReference: getModelNameByReference,
    replaceSwaggerReferences: replaceSwaggerReferences
};