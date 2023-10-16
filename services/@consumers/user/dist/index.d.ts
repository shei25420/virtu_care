import RabbitMQ from '@shared/rabbitmq';

declare module 'fastify' {
    interface FastifyInstance {
        rmq: RabbitMQ;
    }
}
