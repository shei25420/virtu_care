import fp from 'fastify-plugin'
import RabbitMQ from "@shared/rabbitmq";
import {FastifyInstance} from "fastify";

export default fp(async (fastify: FastifyInstance) => {
    try {
        const rmq = new RabbitMQ(process.env.RABBITMQ_URL || "amqps://gztpajlb:v2sZ-56M_GFyI6fbDY7LEc3LfFZmKFoN@shrimp.rmq.cloudamqp.com/gztpajlb");
        await rmq.createConnection();
        fastify.decorate('rmq', rmq);
    } catch (e) {
        throw new Error("Error registering fastify rabbitmq plugin", {
            cause: e
        });
    }
});