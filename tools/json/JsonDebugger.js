module.exports = {
    debug(jsData, title) {
        title = title ? title: "Debugging data";
        
        console.log(`=============== ${title} ===============`);
        console.log(JSON.stringify(jsData, null, 4));
        console.log("\n\n");
    }
}