import {FastifySchema} from "fastify";

const schema: FastifySchema = {
    body: {
        type: 'object',
        properties: {
            email: {
                type: "string",
            },
            password: {
                type: "string",
            }
        },
        required: ['email', 'password']
    }
};

export default schema;