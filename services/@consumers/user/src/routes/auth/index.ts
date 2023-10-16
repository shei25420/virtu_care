import {FastifyInstance, FastifyServerOptions} from "fastify";

import schema from "./schema";
import authController from "../../controllers/auth";
export default async (fastify: FastifyInstance, opts: FastifyServerOptions) => {
    const handlers = authController(fastify);
    fastify.route({
        method: 'POST',
        url: "/register",
        handler: handlers.register,
        schema
    });
};