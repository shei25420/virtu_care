import {connect, Message, Channel, Connection, Options} from 'amqplib'

export type ConsumerFunc = (msg: Message | null) => void;

class RabbitMQ {
    private readonly connectionUrl: string;
    public _channel: Channel | null = null;
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

            const q = await this._channel.assertQueue("", {
                exclusive: true
            });

            for (const topic of topics) {
               await this._channel?.bindQueue(q.queue, exchangeName, topic);
            }

            console.log("[+] ready to receive messages");

            const repliesConsume = await this._channel.consume(q.queue, consumeFunc);
        } catch (e) {
            throw new Error("Error creating listening exchange topic", {
                cause: e
            });
        }
    }
    async publishMessageToExchange (exchangeName: string, topicKey: string, msg: Buffer, options?: Options.Publish) {
        if (!this.connection) throw new Error("No connection to message broker");
        if (!this._channel) throw new Error("No message broker channel created");

        try {
            const assertExchange = await this._channel.assertExchange(exchangeName, 'topic', {
                durable: true
            });

            this._channel.publish(exchangeName, topicKey, msg, options);
        } catch (e) {
            throw new Error("Error publishing message to exchange", {
                cause: e
            });
        }
    }

    async createProducerQueue (consumeFunc: ConsumerFunc) {
        if (!this.connection) throw new Error("No connection to message broker");
        if (!this._channel) throw new Error("No message broker channel created");

        try {
            const q =  await this._channel.assertQueue("", {
                exclusive: true
            });

            if (q) await this._channel.consume(q.queue, consumeFunc, {
                noAck: true
            });
            return q;
        } catch (e) {
            throw new Error("Error creating producer queue", {
                cause: e
            });
        }
    }

    async sendMessageToQueue (queueName: string, message: Buffer, autoAck: boolean, msg?: Message)  {
        if (!this.connection) throw new Error("No connection to message broker");
        if (!this._channel) throw new Error("No message broker channel created");

        try {
            this._channel.sendToQueue(queueName, message);
            if (!autoAck && msg) {
                this._channel.ack(msg);
            }
        } catch (e) {
            throw new Error(`Error sending message to queue: ${queueName}`, {
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
}

export default RabbitMQ;