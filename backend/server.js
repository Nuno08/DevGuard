const app = require('./app');
require('dotenv').config();
const prisma = require('./prisma/prisma');
const logger = require('./infra/logger/logger');

const PORT = process.env.PORT || 3000;

async function start() {
    try{
        await prisma.$connect();
        app.listen(PORT, () => {
            logger.info(`Server running on ${PORT}`);
        });
    }catch(error){
        logger.error('Failed to connect to DB', error);
        process.exit(1);
    }
}

start();
