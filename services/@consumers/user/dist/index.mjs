import fastify from 'fastify';
import fp from 'fastify-plugin';
import RabbitMQ from '@shared/rabbitmq';
import crypto from 'crypto';

const rabbitmq = fp(async (fastify) => {
  try {
    const rmq = new RabbitMQ(process.env.RABBITMQ_URL || "amqps://gztpajlb:v2sZ-56M_GFyI6fbDY7LEc3LfFZmKFoN@shrimp.rmq.cloudamqp.com/gztpajlb");
    await rmq.createConnection();
    fastify.decorate("rmq", rmq);
  } catch (e) {
    throw new Error("Error registering fastify rabbitmq plugin", {
      cause: e
    });
  }
});

const schema = {
  body: {
    type: "object",
    properties: {
      email: {
        type: "string"
      },
      password: {
        type: "string"
      }
    },
    required: ["email", "password"]
  }
};

const authController = (fastify) => {
  return {
    register: async (req, reply) => {
      try {
        const responsePromise = new Promise(async (resolve, reject) => {
          const q = await fastify.rmq.createProducerQueue((msg) => {
            if (!msg)
              return;
            resolve(JSON.parse(JSON.stringify(msg.content.toString())));
          });
          const correlationId = crypto.randomBytes(16).toString("hex");
          await fastify.rmq.publishMessageToExchange("user", "user.crud.create", Buffer.from(JSON.stringify(req.body)), {
            correlationId,
            replyTo: q.queue
          });
        });
        const response = await responsePromise;
        reply.status(200).send(response);
      } catch (e) {
        fastify.log.error(e);
        reply.status(500).send({
          message: "An error occurred while trying to process your request. Please try again"
        });
      }
    }
  };
};

const authRoutes = async (fastify, opts) => {
  const handlers = authController(fastify);
  fastify.route({
    method: "POST",
    url: "/register",
    handler: handlers.register,
    schema
  });
};

const server = fastify({
  logger: process.env.NODE_ENV === "development"
});
const startServer = async () => {
  try {
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
