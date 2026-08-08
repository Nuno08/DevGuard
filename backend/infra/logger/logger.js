const logger = {
    info : (msg) => console.log(`[INFO] ${new Date().toLocaleString("pt-PT")} - ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${new Date().toLocaleString("pt-PT")} - ${msg}`),
    error: (msg) => console.error(`[ERROR] ${new Date().toLocaleString("pt-PT")} - ${msg}`)
};

module.exports = logger;