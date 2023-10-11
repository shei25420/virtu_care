import { connect, Message, Channel, Connection } from 'amqplib'

export type ConsumerFunc = (msg: Message | null) => void;

class RabbitMQ {
    private readonly connectionUrl: string;
    private _channel: Channel | null = null;
    private connection: Connection | null = null;

    constructor(connectionUrl: string) {
        this.connectionUrl = connectionUrl;
    }

    async createConnection () {
        try {
            this.connection = await connect(this.connectionUrl, {
                heartbeat: 2
            });

            this._channel = await this.connection.createChannel();
        } catch (e) {
            throw new Error("Error creating connection", {
                cause: e
            });
        }
    }

    async createListeningExchangeByTopic (exchangeName: string, topics: string[], consumeFunc: ConsumerFunc) {
        if (!this.connection) throw new Error("No connection to message broker");
        if (!this._channel) throw new Error("No channel has been created yet");

        try {
            await this._channel.assertExchange(exchangeName, 'topic', {
                durable: true
            });

            const replies = await this._channel.assertQueue("", {
                exclusive: true
            });
            console.log("[+] waiting for messages");

            const repliesConsume = await this._channel.consume(replies.queue, consumeFunc);
        } catch (e) {
            throw new Error("Error creating listening exchange topic", {
                cause: e
            });
        }
    }
    async publishMessageToExchange (exchangeName: string, topicKey: string, msg: any) {
        if (!this.connection) throw new Error("No connection to message broker");
        if (!this._channel) throw new Error("No message broker channel created");

        try {
            const assertExchange = await this._channel.assertExchange(exchangeName, 'topic', {
                durable: true
            });

            this.channel?.publish(exchangeName, topicKey, Buffer.from(msg));
        } catch (e) {
            throw new Error("Error publishing message to exchange", {
                cause: e
            });
        }
    }

    async closeConnection () {
        if (!this.connection) throw new Error("No connection established to message broker");

        try {
            await this.connection.close();
            this._channel = null;
            this.connection = null;
        } catch (e) {
            throw new Error("Error closing connection", {
                cause: e
            });
        }
    }

    get channel(): Channel | null {
        return this._channel;
    }
}

export default RabbitMQ;