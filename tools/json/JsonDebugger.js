module.exports = {
    debug(title, jsData) {
        console.log(`=============== ${title} ===============`);
        console.log(JSON.stringify(jsData, null, 4));
        console.log("\n\n");
    }
}