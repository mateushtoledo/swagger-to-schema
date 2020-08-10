const ReferenceFinder = require("./ReferenceFinder");
const OpenApiUtil = require("../../util/OpenApiUtil");

// const JsonDebugger = require("../json/JsonDebugger");

function extractModels(fullSwagger, modelReference) {
    let models = {};
    let referencesFound = [];

    if (modelReference[OpenApiUtil.REFERENCE_KEYWORD]) {
        // Extract model to navigate in it
        let model = extractModel(modelReference[OpenApiUtil.REFERENCE_KEYWORD], fullSwagger);
        referencesFound = extractRecursive(model);
    } else {
        // Navigate at content
        referencesFound = extractRecursive(modelReference.content);
    }

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
 * Returns the content of model using the reference to it.
 * 
 * @param {String} modelReference Model reference (swagger path). Ex: '#/components/schemas/error'.
 * @param {Object} fullSwagger Swagger content.
 * 
 * @returns {Object} Model definition.
 */
function extractModel(modelReference, fullSwagger) {
    // Extract model path using reference
    let segments = modelReference.split("/");
    let modelPath = segments.filter(segment => (segment.length > 0 && segment !== "#"));

    // Navigate to model using your path
    let model = fullSwagger;
    for (let pathSegment of modelPath) {
        model = model[pathSegment];
    }

    return model;
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
        if (prop !== "responses" && prop === OpenApiUtil.REFERENCE_KEYWORD) {
            references.push(swaggerData[prop]);
        } else if (typeof swaggerData[prop] === "object") {
            references = references.concat(extractRecursive(swaggerData[prop]));
        }
    }

    return references;
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
    let newReferences = ReferenceFinder.findReferencesInModels(searchIn);
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
    extractModel: extractModel,
    extractModels: extractModels,
    recursiveModelExtract: recursiveModelExtract
};