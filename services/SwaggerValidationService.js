module.exports = {
    validateRequestSwagger(request) {
        let validation = { isValid: true };
        let requestBody = request.body;

        if (!requestBody) {
            validation.isValid = false;
            validation.message = "Por favor, informe o corpo da requisição!";
        } else if (!requestBody.swagger) {
            validation.isValid = false;
            validation.message = "O swagger enviado é inválido!";
        } else if (requestBody.swagger.openapi !== "3.0.0") {
            validation.isValid = false;
            validation.message = "O swagger enviado não é um swagger openapi 3.0!";
        }

        return validation;
    }
}