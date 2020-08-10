const OpenApiUtil = require("../../util/OpenApiUtil");

/**
 * Search by references at a item.
 * 
 * @param {Object} itemToSearch Item to search by references.
 * @param {Boolean} searchInSchemaCombinations It's necessary to search by references in schema combinations?
 * @param {Boolean} searchInSchemaExclusion  It's necessary to search by references in schema exclusion?
 * 
 * @returns {Array} List of references found.
 */
function findReferences(itemToSearch, searchInSchemaCombinations = false, searchInSchemaExclusion = false) {
    let newReferences = [];

    // Fix item type (if it's a object and type property is missing)
    if (!itemToSearch.type && itemToSearch.properties) {
        itemToSearch.type = "object";
    }

    if (itemToSearch[OpenApiUtil.REFERENCE_KEYWORD]) {
        newReferences.push(itemToSearch[OpenApiUtil.REFERENCE_KEYWORD]);
    } else if (itemToSearch.type) {
        if (itemToSearch.type === 'object') {
            newReferences = newReferences.concat(searchReferenceAtObject(itemToSearch));
        } else if (itemToSearch.type === 'array') {
            newReferences = newReferences.concat(searchReferenceAtArray(itemToSearch));
        }
    } else {
        if (searchInSchemaCombinations) {
            newReferences = newReferences.concat(searchByReferencesInSchemaCombinations(itemToSearch));
        }
        if (searchInSchemaExclusion) {
            newReferences = newReferences.concat(searchByReferencesInSchemaExclusion(itemToSearch));
        }
    }

    return newReferences;
}

/**
 * Find by subreferences in schema combinations ('oneOf', 'allOf', 'anyOf' keywords).
 * 
 * @param {Object} searchIn Object to search by subreferences.
 * 
 * @returns {Array} List of references found.
 */
function searchByReferencesInSchemaCombinations(searchIn) {
    let newReferences = [];

    for (let combinationKeyword of OpenApiUtil.COMBINE_SCHEMAS_KEYWORDS) {
        if (searchIn[combinationKeyword]) {
            let listOfItems = searchIn[combinationKeyword];
            for (let item of listOfItems) {
                newReferences = newReferences.concat(findReferences(item));
            }
        }
    }

    return newReferences;
}

/**
 * Find by definition subreferences in exclusive definition ('not' keyword).
 * 
 * @param {Object} searchIn Object to search by not keyword.
 * 
 * @returns {Array} List of references found.
 */
function searchByReferencesInSchemaExclusion(searchIn) {
    let newReferences = [];

    if (searchIn[OpenApiUtil.EXCLUDE_SCHEMA_KEYWORD]) {
        let exclusiveReference = searchIn[OpenApiUtil.EXCLUDE_SCHEMA_KEYWORD];
        newReferences = newReferences.concat(findReferences(exclusiveReference));
    }

    return newReferences;
}

/**
 * Navigate at all fields of model in search of references.
 * 
 * @param {object} modelDefinition  Model definition.
 * 
 * @returns {Array} List of references found.
 */
function searchReferenceAtObject(modelDefinition) {
    let newReferences = [];

    if (modelDefinition.properties) {
        for (let propertyName in modelDefinition.properties) {
            let propertyDefinition = modelDefinition.properties[propertyName];
            newReferences = newReferences.concat(findReferences(propertyDefinition, true, true));
        }
    } else if (modelDefinition[OpenApiUtil.REFERENCE_KEYWORD]) {
        newReferences.push(modelDefinition[OpenApiUtil.REFERENCE_KEYWORD]);
    }

    return newReferences;
}

/**
 * Navigate at array definition in search of references.
 * 
 * @param {Object} modelDefinition Array definition.
 * 
 * @returns {Array} List of references found.
 */
function searchReferenceAtArray(modelDefinition) {
    let newReferences = [];

    if (modelDefinition.items) {
        let arrayItems = modelDefinition.items;
        newReferences = newReferences.concat(findReferences(arrayItems, true, true));
    }

    return newReferences;
}

/**
 * Navigate at extracted models in search of references.
 * 
 * @param {Object} models Models extracted from DataExtractor.extractModels.
 * It's a key value object: key as the name of object (or the path), and the value is the object definition.
 * 
 * @returns {Array} List of models found.
 */
function findReferencesInModels(models) {
    let newReferences = [];

    for (let property in models) {
        let propertyDefinition = models[property];
        newReferences = newReferences.concat(findReferences(propertyDefinition, true, true));
    }

    return newReferences;
}

module.exports.findReferencesInModels = findReferencesInModels;