const DataExtractor = require("../swagger/DataExtractor");
const REFERENCE_KEYWORD = "$ref";

/**
 * Navigate to item at swagger and check if it's a json content schema.
 * 
 * @param {String} referencePath Path to item (like '#/components/responses/Response200').
 * 
 * @param {Object} swagger Swagger data.
 */
function searchOfJsonContentByReference(referencePath, swagger) {
    let modelContent = DataExtractor.extractModel(referencePath, swagger);
    return haveJsonContent(modelContent, swagger);
}

/**
* Search by: $.content.application/json.schema.
* 
* @param {object} item Item to verify if it has a application/json content.
* 
* @returns {boolean} The item has json content?
*/
function haveJsonContent(item, swagger) {
    if (!item) {
        return false;
    }

    if (item.content && item.content["application/json"] && item.content["application/json"].schema) {
        return true;
    } else if (item[REFERENCE_KEYWORD]) {
        return searchOfJsonContentByReference(item[REFERENCE_KEYWORD], swagger);
    } else {
        return false;
    }
}

module.exports = {
    haveJsonContent: haveJsonContent
};