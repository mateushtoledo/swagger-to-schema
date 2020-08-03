const HTTP_METHODS = [
    "GET",
    "HEAD",
    "POST",
    "PUT",
    "DELETE",
    "CONNECT",
    "OPTIONS",
    "TRACE",
    "PATCH"
];

module.exports = {
    isValidHttpMethod(methodCandidate) {
        methodCandidate = methodCandidate.toUpperCase();
        return HTTP_METHODS.indexOf(methodCandidate) >= 0;

    }
};