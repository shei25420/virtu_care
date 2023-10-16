import fastify from "fastify";
import rmqPlugin from './plugins/rabbitMQ';
import dotenv from 'dotenv'

dotenv.config();
const server = fastify({
    logger: process.env.NODE_ENV === 'development'
});

const startServer = async () => {
    await server.register(rmqPlugin);
    server.listen({
        port: parseInt(process.env.SERVICE_PORT || "0"),
        host: process.env.SERVICE_HOST || ""
    }, (err, address) => {
        if (err) {
            server.log.error(err);
            process.exit(1)
        }
        server.log.info(`Server running at address: ${address}`);
    });
};

(async () => {
    await startServer();
})();