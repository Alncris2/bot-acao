
class MessageCache {
    constructor() {
        this.cache = new Map();
        this.expirationTime = 5 * 60 * 1000;
    }
    addMessage(userId, messageContent) {
        const key = `${userId}:${messageContent}`;
        this.cache.set(key, Date.now());

        setTimeout(() => {
            this.cache.delete(key);
        }, this.expirationTime);
    }
    hasRecentMessage(userId, messageContent) {
        const key = `${userId}:${messageContent}`;
        const timestamp = this.cache.get(key);

        if (!timestamp) return false;

        const now = Date.now();
        return (now - timestamp) < this.expirationTime;
    }
    cleanExpiredEntries() {
        const now = Date.now();
        for (const [key, timestamp] of this.cache.entries()) {
            if (now - timestamp >= this.expirationTime) {
                this.cache.delete(key);
            }
        }
    }
}

const messageCache = new MessageCache();

setInterval(() => {
    messageCache.cleanExpiredEntries();
}, 10 * 60 * 1000);
module.exports = messageCache;