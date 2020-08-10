const ReferenceTool = require("./ReferenceTool");
const RegexProvider = require("./RegexProvider");
const OpenApiUtil = require("../../util/OpenApiUtil");

const SCHEMA_DEFINITIONS_PATH = "#/definitions/";

/**
 * Add generic keywords to property, if it's present in property definitions.
 * 
 * @param {Object} property JSON schema property.
 * @param {Object} propertyDefinition Property definition, in swagger.
 * 
 * @returns {Object} JSON Schema property with more details.
 */
function addGenericKeywords(property, propertyDefinition) {
    if (propertyDefinition.enum) {
        if (property.pattern) {
            delete property.pattern;
        }
        property.enum = propertyDefinition.enum;
    }
    return property;
}

/**
 * Create the mapping of boolean property in swagger to boolean property in json schema.
 * 
 * @returns {Object} Boolean property mapping.
 */
function mapBooleanToSchema() {
    return {
        type: "boolean"
    };
}

/**
 * Converts the property format of strings to property pattern, selection a custom regex pattern.
 * 
 * @param {String} stringFormat Value of format attribute (date, date-time, email...).
 * @param {Boolean} isRequired The property that have the format attribute is required?
 * 
 * @returns {String | null} Regex pattern to validate the string format.
 */
function mapStringFormatToRegexPattern(stringFormat, isRequired) {
    switch (stringFormat) {
        case "date":
            return RegexProvider.getRegexPattern(isRequired ? "REQUIRED_DATE" : "OPTIONAL_DATE");
        case "date-time":
            return RegexProvider.getRegexPattern(isRequired ? "REQUIRED_DATETIME" : "OPTIONAL_DATETIME");
        case "email":
            return RegexProvider.getRegexPattern(isRequired ? "REQUIRED_EMAIL" : "OPTIONAL_EMAIL");
        case "uri":
            return RegexProvider.getRegexPattern(isRequired ? "REQUIRED_URI" : "OPTIONAL_URI");
        case "ipv4":
            return RegexProvider.getRegexPattern(isRequired ? "REQUIRED_IPV4" : "OPTIONAL_IPV4");
        case "ipv6":
            return RegexProvider.getRegexPattern(isRequired ? "REQUIRED_IPV6" : "OPTIONAL_IPV6");
    }
}

/**
 * Add more details about the numeric property.
 * 
 * @param {Object} numericProperty Property definition, in json schema.
 * @param {Object} propertyDefinition Property definition, in swagger.
 * 
 * @returns {Object} Json schema property with all details found.
 */
function complementNumericProperty(numericProperty, propertyDefinition) {
    if (typeof propertyDefinition.minimum !== 'undefined') {
        numericProperty.minimum = propertyDefinition.minimum;
        if (typeof propertyDefinition.exclusiveMinimum !== 'undefined') {
            numericProperty.exclusiveMinimum = propertyDefinition.exclusiveMinimum;
        }
    }

    if (typeof propertyDefinition.maximum !== 'undefined') {
        numericProperty.maximum = propertyDefinition.maximum;
        if (typeof propertyDefinition.exclusiveMaximum !== 'undefined') {
            numericProperty.exclusiveMaximum = propertyDefinition.exclusiveMaximum;
        }
    }

    if (propertyDefinition.multipleOf) {
        numericProperty.multipleOf = propertyDefinition.multipleOf;
    }

    return addGenericKeywords(numericProperty, propertyDefinition);
}

/**
 * Converts the string property in swagger to boolean property in json schema.
 * 
 * @param {Object} definition Property definition, in swagger.
 * @param {Boolean} isRequired This property is required?
 * 
 * @returns {Object} Json schema definition of property.
 */
function mapStringToSchema(definition, isRequired) {
    let stringDefinition = {
        type: definition.nullable ? ["string", "null"] : "string"
    };

    if (typeof definition.minLength !== 'undefined') {
        stringDefinition.minLength = definition.minLength;
    }

    if (typeof definition.maxLength !== 'undefined') {
        stringDefinition.maxLength = definition.maxLength;
    }

    if (definition.pattern) {
        stringDefinition.pattern = definition.pattern;
    } else if (definition.format) {
        let regexPattern = mapStringFormatToRegexPattern(definition.format, isRequired);
        if (regexPattern) {
            stringDefinition.pattern = regexPattern;
        }
    } else if (isRequired) {
        stringDefinition.pattern = RegexProvider.getRegexPattern("REQUIRED_STRING");
    }

    return addGenericKeywords(stringDefinition, definition);
}

/**
 * Search by advanced definitions (oneOff, allOf, anyOf, not) and map it to json schema.
 * 
 * @param {Object} definition Item to search by advanced references.
 * @param {Object} schemaToAdd Item to map the found items.
 * 
 * @returns Received object converted to JSON schema.
 */
function mapAdvancedDefinitionsToSchema(definition, schemaToAdd) {
    if (definition[OpenApiUtil.EXCLUDE_SCHEMA_KEYWORD]) {
        schemaToAdd[OpenApiUtil.EXCLUDE_SCHEMA_KEYWORD] = mapObjectToSchema(definition[OpenApiUtil.EXCLUDE_SCHEMA_KEYWORD]);
    } else {
        for (let mr of OpenApiUtil.COMBINE_SCHEMAS_KEYWORDS) {
            if (definition[mr]) {
                schemaToAdd[mr] = [];
                for (let itemToMap of definition[mr]) {
                    schemaToAdd[mr].push(mapObjectToSchema(itemToMap));
                }
            }
        }
    }
    return schemaToAdd;
}

/**
 * Convert the array items of swagger to array items of json schema.
 * 
 * @param {Object} arrayItems Swagger definition of array items.
 * 
 * @returns {Object} Definition of array items in JSON schema.
 */
function mapArrayItemsToSchema(arrayItems) {
    let arrayItemSchema = {};

    if (arrayItems.properties) {
        arrayItems.type = "object";
    }

    if (arrayItems.type) {
        arrayItemSchema.type = arrayItems.type;
        if (arrayItemSchema.type !== "array") {
            return mapObjectToSchema(arrayItems);
        } else {
            arrayItemSchema.items = mapArrayItemsToSchema(arrayItems.items);
        }
    }

    if (arrayItems[OpenApiUtil.REFERENCE_KEYWORD]) {
        arrayItemSchema[OpenApiUtil.REFERENCE_KEYWORD] = SCHEMA_DEFINITIONS_PATH + ReferenceTool.getModelNameByReference(arrayItems[OpenApiUtil.REFERENCE_KEYWORD]);
    } else {
        arrayItemSchema = mapAdvancedDefinitionsToSchema(arrayItems, arrayItemSchema);
    }

    return arrayItemSchema;
}

/**
 * Converts the swagger numeric property to json schema numeric property.
 * 
 * @param {Object} definition Property definition, in swagger.
 * 
 * @returns {Object} Property definition, in json schema.
 */
function mapNumberToSchema(definition) {
    let integerDefinition = {
        type: "number"
    };

    return complementNumericProperty(integerDefinition, definition);
}

/**
 * Converts the swagger integer property to json schema integer property.
 * 
 * @param {Object} definition Property definition, in swagger.
 * 
 * @returns {Object} Property definition, in json schema.
 */
function mapIntegerToSchema(definition) {
    let integerDefinition = {
        type: "integer"
    };

    return complementNumericProperty(integerDefinition, definition);
}

/**
 * Convert swagger object properties to json schema object properties.
 * 
 * @param {Object} modelProperties Properties of swagger object.
 * @param {Array} requiredProperties List of required properties.
 * 
 * @returns {Object} Properties of object in json schema.
 */
function mapPropertiesToSchema(modelProperties, requiredProperties) {
    let properties = {};

    for (let propertyName in modelProperties) {
        let propertyDefinition = modelProperties[propertyName];

        if (propertyName === OpenApiUtil.REFERENCE_KEYWORD) {
            properties[OpenApiUtil.REFERENCE_KEYWORD] = SCHEMA_DEFINITIONS_PATH + ReferenceTool.getModelNameByReference(propertyDefinition);
        } else if (propertyDefinition[OpenApiUtil.REFERENCE_KEYWORD]) {
            let subpropertyDefinition = {};
            subpropertyDefinition[OpenApiUtil.REFERENCE_KEYWORD] = SCHEMA_DEFINITIONS_PATH + ReferenceTool.getModelNameByReference(propertyDefinition[OpenApiUtil.REFERENCE_KEYWORD]);
            properties[propertyName] = subpropertyDefinition;
        } else {
            let foundSomeItem = false;
            let propDefinition = {};

            for (let mr of OpenApiUtil.COMBINE_SCHEMAS_KEYWORDS) {
                if (propertyDefinition[mr]) {
                    foundSomeItem = true;
                    propDefinition[mr] = [];
                    for (let item of propertyDefinition[mr]) {
                        propDefinition[mr].push(mapObjectToSchema(item));
                    }
                }
            }

            if (foundSomeItem) {
                properties[propertyName] = propDefinition;
            }
        }

        if (propertyDefinition.type) {
            let isRequiredProperty = requiredProperties.indexOf(propertyName) >= 0;
            properties[propertyName] = mapPropertyToSchema(propertyDefinition, isRequiredProperty);
        }
    }

    return properties;
}

/**
 * Converts a swagger object to json schema object.
 * 
 * @param {Object} modelSwagger Object definition in swagger.
 * 
 * @returns {Object} Object definition in json schema.
 */
function mapObjectToSchema(modelSwagger) {
    let modelSchema = {};
    let requiredProperties = modelSwagger.required ? modelSwagger.required : [];

    if (modelSwagger[OpenApiUtil.REFERENCE_KEYWORD]) {
        modelSchema[OpenApiUtil.REFERENCE_KEYWORD] = modelSwagger[OpenApiUtil.REFERENCE_KEYWORD];
    }

    if (modelSwagger.type) {
        modelSchema.type = modelSwagger.type;
        if (modelSchema.type !== "array" && modelSchema.type !== "object") {
            return mapPropertyToSchema(modelSwagger, false);
        }
    }

    if (modelSwagger.properties) {
        modelSchema.properties = mapPropertiesToSchema(modelSwagger.properties, requiredProperties);
    }

    if (requiredProperties.length > 0) {
        modelSchema.required = requiredProperties;
    }

    if (modelSwagger.items) {
        modelSchema.items = mapObjectToSchema(modelSwagger.items);
    }

    // Mapy any advanced types of definitions: oneOf, anyOf, allOf, not.
    return mapAdvancedDefinitionsToSchema(modelSwagger, modelSchema);
}

/**
 * Converts a swagger array to json schema array.
 * 
 * @param {Object} definition Array definition, in swagger.
 * 
 * @returns {Object} Array definition, in json schema.
 */
function mapArrayToSchema(definition) {
    let arrayDefinition = {
        type: "array"
    };

    if (definition.items) {
        arrayDefinition.items = mapArrayItemsToSchema(definition.items);
    }

    if (definition.uniqueItems) {
        arrayDefinition.uniqueItems = definition.uniqueItems;
    }

    return arrayDefinition;
}

/**
 * Map a swagger property to a json schema property.
 * 
 * @param {Object} propertyDefinition Property definition, in swagger.
 * @param {Boolean} isRequired This property is required?
 * 
 * @returns {Object} Property definition, in json schema.
 */
function mapPropertyToSchema(propertyDefinition, isRequired) {
    switch (propertyDefinition.type) {
        case "string":
            return mapStringToSchema(propertyDefinition, isRequired);
        case "number":
            return mapNumberToSchema(propertyDefinition);
        case "integer":
            return mapIntegerToSchema(propertyDefinition);
        case "boolean":
            return mapBooleanToSchema();
        case "array":
            return mapArrayToSchema(propertyDefinition);
        case "object":
            return mapObjectToSchema(propertyDefinition);
    }
}

module.exports = {
    mapObjectToSchema: mapObjectToSchema
};