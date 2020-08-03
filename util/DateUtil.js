module.exports = {
    getTodayPlusOneDay() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        return tomorrow.getTime();
    },

    isAfterNow(timestamp) {
        const now = new Date();
        return timestamp > now.getTime();
    }
};