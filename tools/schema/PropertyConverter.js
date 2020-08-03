const ReferenceTool = require("./ReferenceTool");
const RegexProvider = require("./RegexProvider");
const DataExtractor = require("../swagger/DataExtractor");

const REFERENCE_KEYWORD = "$ref";
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
 * Convert the array items of swagger to array items of json schema.
 * 
 * @param {Object} arrayItems Swagger definition of array items.
 * 
 * @returns {Object} Definition of array items in JSON schema.
 */
function mapArrayItemsToSchema(arrayItems) {
    let arrayItemSchema = {};

    if (arrayItems.type) {
        arrayItemSchema.type = arrayItems.type;
        if (arrayItemSchema.type !== "array") {
            /* if (arrayItems.properties) { arrayItemSchema.properties = createSchemaProperties(arrayItems.properties, arrayItems.required ? arrayItems.required : []);} */
            return mapObjectToSchema(arrayItems);
        } else {
            arrayItemSchema.items = mapArrayItemsToSchema(arrayItems.items);
        }
    }

    if (arrayItems[REFERENCE_KEYWORD]) {
        arrayItemSchema[REFERENCE_KEYWORD] = SCHEMA_DEFINITIONS_PATH + ReferenceTool.getModelNameByReference(arrayItems[REFERENCE_KEYWORD]);
    } else {
        let references = DataExtractor.findAdvancedReferences(arrayItems);
        if (references.type) {
            let type = references.type;
            arrayItemSchema[type] = references.refs;
        }
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
    properties = {};

    for (let propertyName in modelProperties) {
        let propertyDefinition = modelProperties[propertyName];

        if (propertyDefinition === REFERENCE_KEYWORD) {
            properties[REFERENCE_KEYWORD] = SCHEMA_DEFINITIONS_PATH + ReferenceTool.getModelNameByReference(propertyDefinition);
        } else if (propertyDefinition[REFERENCE_KEYWORD]) {
            let subpropertyDefinition = {};
            subpropertyDefinition[REFERENCE_KEYWORD] = SCHEMA_DEFINITIONS_PATH + ReferenceTool.getModelNameByReference(propertyDefinition[REFERENCE_KEYWORD]);
            properties[propertyName] = subpropertyDefinition;
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

    if (modelSwagger[REFERENCE_KEYWORD]) {
        modelSchema[REFERENCE_KEYWORD] = modelSwagger[REFERENCE_KEYWORD];
    }

    if (modelSwagger.type) {
        modelSchema.type = modelSwagger.type;
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

    return modelSchema;
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