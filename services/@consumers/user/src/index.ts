import fastify from "fastify";
import rabbitmq from "./plugins/rabbitmq";

//Service Routes
import authRoutes from './routes/auth';
import RabbitMQ from "@shared/rabbitmq";

declare module 'fastify' {
    interface FastifyInstance {
        rmq: RabbitMQ
    }
}

const server = fastify({
    logger: process.env.NODE_ENV === 'development'
});

const startServer = async () => {
    try {
        //Register rabbitmq package
        await server.register(rabbitmq);
        await server.register(authRoutes);

        server.listen({
            port: parseInt(process.env.PORT || "0", 10),
            host: process.env.HOST || "localhost"
        }, (err, address) => {
            if (err) {
                server.log.error(err);
                process.exit(1);
            }
            server.log.info(`User service consumer running at ${address}`);
        });
    } catch (e) {
        server.log.error(e);
        process.exit(1);
    }
};

startServer();