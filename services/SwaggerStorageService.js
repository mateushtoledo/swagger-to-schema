const SwaggerStorage = require('../storage/SwaggerStorage');
const SwaggerCleaner = require('../tools/swagger/SwaggerCleaner');

module.exports = {

    /**
     * Remove metadata and save swagger.
     * 
     * @param {Object} swagger Swagger definition.
     */
    saveSwagger(swagger) {
        swagger = SwaggerCleaner.cleanSwagger(swagger);
        SwaggerStorage.persistSwagger(swagger);
    },

    /**
     * Load the swagger identified by the specified id.
     * 
     * @param {String} id Swagger identifier.
     * 
     * @returns {Object | null} Swagger found.
     */
    findSwaggerById(id) {
        return SwaggerStorage.readSwagger(id);
    },

    /**
     * Remover all old swaggers, permanently.
     */
    deleteOldSwaggers() {
        SwaggerStorage.deleteExpiredSwaggers();
    }
}