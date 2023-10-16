import * as amqplib from 'amqplib';
import { Message, Channel, Options } from 'amqplib';

type ConsumerFunc = (msg: Message | null) => void;
declare class RabbitMQ {
    private readonly connectionUrl;
    _channel: Channel | null;
    private connection;
    constructor(connectionUrl: string);
    createConnection(): Promise<void>;
    createListeningExchangeByTopic(exchangeName: string, topics: string[], consumeFunc: ConsumerFunc): Promise<void>;
    publishMessageToExchange(exchangeName: string, topicKey: string, msg: Buffer, options?: Options.Publish): Promise<void>;
    createProducerQueue(consumeFunc: ConsumerFunc): Promise<amqplib.Replies.AssertQueue>;
    sendMessageToQueue(queueName: string, message: Buffer, autoAck: boolean, msg?: Message): Promise<void>;
    closeConnection(): Promise<void>;
}

export { type ConsumerFunc, RabbitMQ as default };
