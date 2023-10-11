import { Message, Channel } from 'amqplib';

type ConsumerFunc = (msg: Message | null) => void;
declare class RabbitMQ {
    private readonly connectionUrl;
    private _channel;
    private connection;
    constructor(connectionUrl: string);
    createConnection(): Promise<void>;
    createListeningExchangeByTopic(exchangeName: string, topics: string[], consumeFunc: ConsumerFunc): Promise<void>;
    publishMessageToExchange(exchangeName: string, topicKey: string, msg: any): Promise<void>;
    closeConnection(): Promise<void>;
    get channel(): Channel | null;
}

export { type ConsumerFunc, RabbitMQ as default };
