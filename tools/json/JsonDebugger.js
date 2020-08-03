module.exports = {
    debug(title, jsData) {
        console.log(`=============== ${title} ===============`);
        console.log(JSON.stringify(jsData));
        console.log("\n\n");
    }
}