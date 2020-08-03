const fs = require('fs');
const DateUtil = require('../util/DateUtil');

module.exports = {

    persistSwagger(swagger) {
        const uploadFolder = process.env.TEMP_FILE_STORAGE;
        let swaggerAsString = JSON.stringify(swagger);

        fs.writeFileSync(`${uploadFolder}${swagger.id}.json`, swaggerAsString, (err) => {
            if (err) {
                console.error(err);
                throw err;
            }
            console.log("Swagger uploaded....");
        });
    },

    readSwagger(swaggerId) {
        const filePath = process.env.TEMP_FILE_STORAGE + `${swaggerId}.json`;
        try {
            let fileContent = fs.readFileSync(filePath, "utf-8");
            return JSON.parse(fileContent.toString());
        } catch (ex) {
            return null;
        }
    },

    deleteExpiredSwaggers() {
        const uploadFolder = process.env.TEMP_FILE_STORAGE;
        let filesToRemove = [];

        // Select what files that will be deleted
        fs.readdirSync(uploadFolder, function (err, files) {
            if (err) {
                console.error("Couldn't list the directory.", err);
            }

            files.forEach(function (file) {
                const filePath = `${uploadFolder}${file}`;
                fs.readFileSync(filePath, 'utf-8', (err, data) => {
                    if (err) {
                        console.error(`Failed to read content of ${file}...`);
                    }

                    const fileContent = JSON.parse(data.toString());
                    if (DateUtil.isAfterNow(fileContent.expiration)) {
                        filesToRemove.push(filePath);
                    }
                });
            });
        });

        filesToRemove.forEach(filePath => {
            fs.unlinkSync(filePath);
        });
    }
}