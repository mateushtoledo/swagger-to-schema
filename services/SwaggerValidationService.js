function isOpenApi(swagger) {
    const openApiVersionRegex = new RegExp("^3\\.0(\\.[0-9]+)*$");

    if (!swagger.openapi) {
        return false;
    } else {
        let openApiVersion = swagger.openapi;
        return openApiVersionRegex.test(openApiVersion);
    }
}

function validateRequestSwagger(request) {
    let validation = { isValid: true };
    let requestBody = request.body;

    if (!requestBody) {
        validation.isValid = false;
        validation.message = "Por favor, informe o corpo da requisição!";
    } else if (!requestBody.swagger) {
        validation.isValid = false;
        validation.message = "O swagger enviado é inválido!";
    } else if (!isOpenApi(requestBody.swagger)) {
        validation.isValid = false;
        validation.message = "O swagger enviado não é um swagger openapi 3.0!";
    }

    return validation;
}

module.exports.validateRequestSwagger = validateRequestSwagger;