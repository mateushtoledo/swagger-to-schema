const EndpointService = require('../services/SwaggerEndpointService');
const StorageService = require('../services/SwaggerStorageService');
const ValidationService = require('../services/SwaggerValidationService');

const { v4: uuidv4 } = require('uuid');
const DateUtil = require('../util/DateUtil');

module.exports = {
  /**
   * Read, remove unused informations, and persist the received swagger.
   * 
   * @param {*} req Request.
   * @param {*} res Response.
   */
  uploadSwagger(req, res) {
    StorageService.deleteOldSwaggers();

    // Validate swagger
    let swaggerValidation = ValidationService.validateRequestSwagger(req);
    if (!swaggerValidation.isValid) {
      return res.status(400).json({
        message: swaggerValidation.message
      });
    }

    // Clean swagger and do small changes
    let swagger = req.body.swagger;
    swagger.id = uuidv4();
    swagger.expiration = DateUtil.getTodayPlusOneDay();
    swagger = EndpointService.assignIdToEndpoints(swagger);

    // Persist swagger to file system
    try {
      StorageService.saveSwagger(swagger);
    } catch (err) {
      return res.status(500).json({ message: "Sorry. An error ocurred while trying to save your file." });
    }

    return res.status(201)
      .json({
        id: swagger.id,
        _links: {
          _endpoints: process.env.BASE_URL + `swaggers/${swagger.id}/endpoints`
        }
      });
  }
};