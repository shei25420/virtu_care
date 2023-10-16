import crypto from 'crypto'
import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";

export default (fastify: FastifyInstance) => {
    return {
        register: async (req: FastifyRequest, reply: FastifyReply) => {
            try {
                const responsePromise = new Promise(async (resolve, reject) => {
                    //Create Queue To Read Response From Producer
                    const q = await fastify.rmq.createProducerQueue((msg) => {
                        if (!msg) return;
                        resolve(JSON.parse(JSON.stringify(msg.content.toString())));
                    });

                    const correlationId = crypto.randomBytes(16).toString('hex');
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
    }
}