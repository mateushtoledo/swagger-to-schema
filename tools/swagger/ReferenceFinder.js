const REFERENCE_KEYWORD = "$ref";
const MULTIPLE_REFERENCES_KEYWORD = ["oneOf", "allOf", "anyOf"];
const EXCLUSIVE_REFERENCE_KEYWORD = "not";

/**
 * Add type to definition, if it's an object (has properties definition).
 * 
 * @param {Object} itemToFix Item to fix type.
 * 
 * @returns Object with type definition, if it isn't present.
 */
function fixMissingObjectTypeIfItsNecessary(itemToFix) {
    if (!itemToFix.type && itemToFix.properties) {
        itemToFix.type = "object";
    }
    return itemToFix;
}

/**
 * Find by definition of references as a array (oneOf, allOf, anyOf keywords).
 * 
 * @param {Object} searchIn Object to search by array of references.
 * 
 * @returns {Array} List of references found.
 */
function findMultipleReferences(searchIn) {
    let newReferences = [];

    for (let mr of MULTIPLE_REFERENCES_KEYWORD) {
        if (searchIn[mr]) {
            let listOfItems = searchIn[mr];
            for (let item of listOfItems) {
                if (item[REFERENCE_KEYWORD]) {
                    newReferences.push(item[REFERENCE_KEYWORD]);
                } else {
                    item = fixMissingObjectTypeIfItsNecessary(item);
                    if (item.type === "object") {
                        newReferences = newReferences.concat(searchReferenceAtObject(item));
                    } else if (item.type === "array") {
                        newReferences = newReferences.concat(searchReferenceAtArray(item));
                    }
                }
            }
        }
    }

    return newReferences;
}

/**
 * Find by definition of references at a exclusive definition (not keyword).
 * 
 * @param {Object} searchIn Object to search by not keyword.
 * 
 * @returns {Array} List of references found.
 */
function findExclusiveReference(searchIn) {
    let newReferences = [];

    if (searchIn[EXCLUSIVE_REFERENCE_KEYWORD]) {
        let exclusiveReference = searchIn[EXCLUSIVE_REFERENCE_KEYWORD];

        if (exclusiveReference[REFERENCE_KEYWORD]) {
            newReferences.push(exclusiveReference[REFERENCE_KEYWORD])
        } else {
            exclusiveReference = fixMissingObjectTypeIfItsNecessary(exclusiveReference);
            if (exclusiveReference.type) {
                if (exclusiveReference.type === "object") {
                    newReferences = newReferences.concat(searchReferenceAtObject(exclusiveReference));
                } else if (exclusiveReference.type === "array") {
                    newReferences = newReferences.concat(searchReferenceAtArray(exclusiveReference));
                }
            }
        }


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
            propertyDefinition = fixMissingObjectTypeIfItsNecessary(propertyDefinition);

            if (propertyDefinition[REFERENCE_KEYWORD]) {
                newReferences.push(propertyDefinition[REFERENCE_KEYWORD]);
            } else if (propertyDefinition.type) {
                if (propertyDefinition.type === 'object') {
                    newReferences = newReferences.concat(searchReferenceAtObject(propertyDefinition));
                } else if (propertyDefinition.type === 'array') {
                    newReferences = newReferences.concat(searchReferenceAtArray(propertyDefinition));
                }
            } else {
                newReferences = newReferences.concat(findMultipleReferences(propertyDefinition));
                newReferences = newReferences.concat(findExclusiveReference(propertyDefinition));
            }
        }
    } else if (modelDefinition[REFERENCE_KEYWORD]) {
        newReferences.push(modelDefinition[REFERENCE_KEYWORD]);
    }

    return newReferences;
}

/**
 * Search by references in array items.
 * 
 * @param {Array} arrayItems Definition of array items to serch by references.
 * 
 * @returns {Array} References found.
 */
function findReferencesAtArrayItems(arrayItems) {
    let foundReferences = [];
    arrayItems = fixMissingObjectTypeIfItsNecessary(arrayItems);

    if (arrayItems[REFERENCE_KEYWORD]) {
        foundReferences.push(arrayItems[REFERENCE_KEYWORD]);
    } else if (arrayItems.type) {
        // Call the best method to find new references
        if (arrayItems.type === "array") {
            foundReferences = foundReferences.concat(searchReferenceAtArray(arrayItems));
        } else if (arrayItems.type === "object") {
            foundReferences = foundReferences.concat(searchReferenceAtObject(arrayItems));
        }
    } else {
        // Search by multiple and exclusive references
        foundReferences = foundReferences.concat(findMultipleReferences(arrayItems));
        foundReferences = foundReferences.concat(findExclusiveReference(arrayItems));
    }

    return foundReferences;
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
        if (arrayItems[REFERENCE_KEYWORD]) {
            newReferences.push(arrayItems[REFERENCE_KEYWORD]);
        } else if (arrayItems.properties) {
            newReferences = newReferences.concat(searchReferenceAtObject(arrayItems));
        } else {
            let referencesFound = findReferencesAtArrayItems(arrayItems);
            newReferences = newReferences.concat(referencesFound);
        }
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
function findReferences(models) {
    let newReferences = [];

    for (let property in models) {
        let propertyDefinition = models[property];
        propertyDefinition = fixMissingObjectTypeIfItsNecessary(propertyDefinition);

        if (propertyDefinition.type) {
            if (propertyDefinition.type === 'object') {
                newReferences = newReferences.concat(searchReferenceAtObject(propertyDefinition));
            } else if (propertyDefinition.type === 'array') {
                newReferences = newReferences.concat(searchReferenceAtArray(propertyDefinition));
            }
        } else if (property === REFERENCE_KEYWORD) {
            newReferences.push(property);
        } else {
            newReferences = newReferences.concat(findMultipleReferences(propertyDefinition));
            newReferences = newReferences.concat(findExclusiveReference(propertyDefinition));
        }
    }

    return newReferences;
}

module.exports.findReferences = findReferences;