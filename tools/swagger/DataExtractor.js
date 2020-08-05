const ReferenceFinder = require("./ReferenceFinder");
const JsonDebugger = require("../json/JsonDebugger");
const REFERENCE_KEYWORD = "$ref";
const REFERENCE_TYPES = [
    "oneOf",
    "allOf",
    "anyOf",
    "not"
];

function extractModels(fullSwagger, modelReference) {
    let models = {};

    let referencesFound = extractRecursive(modelReference.content);
    if (referencesFound.length > 0) {
        for (let ref of referencesFound) {
            if (ref.trim().length > 0) {
                models[ref] = extractModel(ref, fullSwagger);
            }
        }
    }

    return models;
}

/**
 * Returns content or references associated with the request or response.
 * 
 * @param {Object} jsonContentDefinition Json content definition at swagger.
 * 
 * @returns {object} Object that defines the reference type (single, all of, any of) and reference list.
 */
function buildSchemaBaseStructure(jsonContentDefinition) {
    let contentSchema = jsonContentDefinition.content["application/json"].schema;
    let references = findAdvancedReferences(contentSchema);


    if (!references.refs && contentSchema[REFERENCE_KEYWORD]) {
        references.refs = [contentSchema[REFERENCE_KEYWORD]];
    } else if (!contentSchema.type && contentSchema.properties) {
        contentSchema.type = "object";
    }

    return {
        refType: references.type ? references.type : "single",
        references: references.refs ? references.refs : [],
        body: references.body ? references.body : contentSchema
    };
}

/**
 * Converts the list of references to a list of models.
 * 
 * @param {Object} fullSwagger Swagger content.
 * @param {Array} references List of model references. Ex: ['#/components/schemas/error'].
 * 
 * @returns {Array} List of models.
 
function extractModelsByReferences(fullSwagger, references) {
    return references.map(function (modelRef) {
        return extractModel(modelRef, fullSwagger)
    });;
}*/

/**
 * Returns the content of model using the reference to it.
 * 
 * @param {String} modelReference Model reference (swagger path). Ex: '#/components/schemas/error'.
 * @param {Object} fullSwagger Swagger content.
 * 
 * @returns {Object} Model definition.
 */
function extractModel(modelReference, fullSwagger) {
    let modelPath = getReferenceSegments(modelReference);
    let model = fullSwagger;

    for (let pathSegment of modelPath) {
        model = model[pathSegment];
    }

    return model;
}

/**
 * Serch by advanced references: combination or exclusion.
 * 
 * @param {Array} referencePool List of references.
 * 
 * @returns Object with standardized references.
 */
function findAdvancedReferences(referencePool) {
    let reference = {};

    for (let referenceType of REFERENCE_TYPES) {
        if (referencePool[referenceType]) {
            reference.type = referenceType;
            reference.refs = findAdvancedReferences(referencePool[referenceType]);
            break;
        }
    }

    return reference;
}

/**
 * Extract model references, recursively.
 * 
 * @param {Object} swaggerData Swagger content to find references.
 * 
 * @returns {Array} List with found references.
 */
function extractRecursive(swaggerData) {
    let references = [];

    for (let prop in swaggerData) {
        if (prop !== "responses" && prop === REFERENCE_KEYWORD) {
            references.push(swaggerData[prop]);
        } else if (typeof swaggerData[prop] === "object") {
            references = references.concat(extractRecursive(swaggerData[prop]));
        }
    }

    return references;
}

/**
 * Converts a swagger reference to an array with reference segments.
 * 
 * @param {String} referenceString Model reference (swagger path). Ex: '#/components/schemas/error'.
 * 
 * @returns {Array} Reference segments. Ex: ['components', 'schemas', 'error'].
 */
function getReferenceSegments(referenceString) {
    let segments = referenceString.split("/");
    return segments.filter(segment => (segment.length > 0 && segment !== "#"));
}

/**
 * Load submodels (not known), recursively.
 * 
 * @param {Object} swagger Swagger definition.
 * @param {Array} knownModels Loaded models.
 * @param {Array} searchIn Search references in these models, and append it to the known models list.
 * 
 * @returns {Array} All necessary models.
 */
function recursiveModelExtract(swagger, knownModels, searchIn) {
    // Stop criterion: All models loaded
    let newReferences = ReferenceFinder.findReferences(searchIn);
    if (newReferences.length === 0) {
        return knownModels;
    }

    // Recursive criterion: More models to load
    let newModels = {};
    newReferences.forEach(ref => {
        if (!knownModels[ref]) {
            let newModel = extractModel(ref, swagger);
            newModels[ref] = newModel;
            knownModels[ref] = newModel;
        }
    });

    return recursiveModelExtract(swagger, knownModels, newModels);
}

module.exports = {
    buildSchemaBaseStructure: buildSchemaBaseStructure,
    extractModel: extractModel,
    extractModels: extractModels,
    findAdvancedReferences: findAdvancedReferences,
    recursiveModelExtract: recursiveModelExtract
};