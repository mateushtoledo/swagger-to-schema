const REFERENCE_KEYWORD = "$ref";

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
            if (propertyDefinition.type) {
                if (propertyDefinition.type === 'object') {
                    newReferences = newReferences.concat(searchReferenceAtObject(propertyDefinition));
                } else if (propertyDefinition.type === 'array') {
                    newReferences = newReferences.concat(searchReferenceAtArray(propertyDefinition));
                }
            } else if (propertyDefinition[REFERENCE_KEYWORD]) {
                newReferences.push(propertyDefinition[REFERENCE_KEYWORD]);
            }
        }
    } else if (modelDefinition[REFERENCE_KEYWORD]) {
        newReferences.push(modelDefinition[REFERENCE_KEYWORD]);
    }

    return newReferences;
}

/**
 * Search by references in all items of list.
 * 
 * @param {Array} references List of items to serch by references.
 * 
 * @returns {Array} References found.
 */
function getAllReferences(references) {

    let foundReferences = [];

    for (let item in references) {
        if (item[REFERENCE_KEYWORD]) {
            foundReferences.push(item[REFERENCE_KEYWORD]);
        }
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
            newReferences = newReferences.concat(searchReferenceAtObject(arrayItems.properties));
        } else {
            let refObject = getAllReferences(arrayItems);
            if (refObject.refs && refObject.refs.length > 0) {
                newReferences = newReferences.concat(refObject.refs);
            }
        }
    }

    return newReferences;
}

/**
 * Navigate at extracted models in search of references.
 * 
 * @param {Object} models Models extracted from DataExtractor.extractModels.
 * 
 * @returns {Array} List of models found.
 */
function findReferences(models) {
    let newReferences = [];

    for (let property in models) {
        let propertyDefinition = models[property];
        if (propertyDefinition.type) {
            if (propertyDefinition.type === 'object') {
                newReferences = newReferences.concat(searchReferenceAtObject(propertyDefinition));
            } else if (propertyDefinition.type === 'array') {
                newReferences = newReferences.concat(searchReferenceAtArray(propertyDefinition));
            }
        } else if (propertyDefinition.properties) {
            newReferences = searchReferenceAtObject(propertyDefinition);
        } else if (property === REFERENCE_KEYWORD) {
            newReferences.push(property);
        }
    }

    return newReferences;
}

module.exports.findReferences = findReferences;