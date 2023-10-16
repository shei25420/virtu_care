import fp from 'fastify-plugin'
import RabbitMQ, { ConsumerFunc } from "@shared/rabbitmq";
import UserRepository, {User} from "../repository";
import {Message} from "amqplib";

enum MessageType {
    CRUD = "crud",
    ANALYTICS = "analytics"
}

enum MessageReq {
    CREATE = "create",
    UPDATE = "update",
    DESTROY = "destroy",
    FETCHALL = "fetchAll",
    FETCHBYID = "fetchById",

}

type MessageResponse = {
    status: boolean,
    data: any
};

class ProducerRabbitMq extends RabbitMQ{
    repo ;
    constructor(amqpUrl: string) {
        super(amqpUrl);
        this.repo = new UserRepository();
    }

    async handleCrudRequests (msgReq: MessageReq, data: Buffer) {
        console.log("Kangura ngite");
        let respData: any;
        let reqData: User | null = null;
        if (msgReq !== MessageReq.FETCHALL) {
            reqData = JSON.parse(data.toString());
            if (!reqData) throw new Error(`Message type of: ${reqData} requires extra data`);
        }
        try {

            switch (msgReq) {
                case MessageReq.CREATE:
                    respData = await this.repo.createUser(reqData as User);
                    break;
                case MessageReq.UPDATE:
                    respData = await this.repo.updateUserById((reqData as User).id as number, (reqData as User).email);
                    break;
                case MessageReq.DESTROY:
                    respData = await this.repo.destroyUserById((reqData as User).id as number);
                    break;
                case MessageReq.FETCHBYID:
                    respData = await this.repo.findUserById((reqData as User).id as number);
                    break;
                default:
                    throw new Error("Unsupported request type");
            }
        } catch (e) {
            throw new Error("Error handling request", {
                cause: e
            });
        }
        return respData;
    }

    async consumeUserMessage(msg: Message | null) {
        if (!msg) return;

        let response: MessageResponse = {
            status: true,
            data: null
        };

        try {
            const messageType: MessageType = msg.fields.routingKey.split(".")[1] as MessageType;
            const messageReq: MessageReq = msg.fields.routingKey.split(".")[2] as MessageReq;

            switch (messageType) {
                case MessageType.CRUD:
                    response.data = await this.handleCrudRequests(messageReq, msg.content);
                    break;
                default:
                    response.status = false;
                    response.data = "Unsupported message type";
                    break;
            }

            // @ts-ignore

        } catch (e) {
            console.log("Fucking error", e);
            response.status = false;
            response.data = e;
            await this.sendMessageToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response)), false)

            super._channel?.ack(msg);
        }

        //Send response back to client:
    }

    async sendMessageToQueue(queueName: string, message: Buffer, autoAck: boolean, msg?: Message): Promise<void> {
       await super.sendMessageToQueue(queueName, message, autoAck, msg);
    }

    async createConnection(): Promise<void> {
        await super.createConnection();
    }

    async createListeningExchangeByTopic(exchangeName: string, topics: string[]): Promise<void> {
        await super.createListeningExchangeByTopic(exchangeName, topics, this.consumeUserMessage.bind(this));
    }
}
export default fp(async (fastify, opts) => {
    const RABBITMQ_USER = process.env.RABBITMQ_USER || "user";
    const RABBITMQ_PASSWD = process.env.RABBITMQ_PASSWD || "hunter";
    const RABBITMQ_HOST = process.env.RABBITMQ_HOST || "localhost";
    const RABBITMQ_VHOST = process.env.RABBITMQ_VHOST || "";

    const rmq = new ProducerRabbitMq(`amqps://${RABBITMQ_USER}:${RABBITMQ_PASSWD}@${RABBITMQ_HOST}/${RABBITMQ_VHOST}`);
    await rmq.createConnection();

    await rmq.createListeningExchangeByTopic("user", ["user.#"]);
    fastify.decorate('rmq', rmq);
});