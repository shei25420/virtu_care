import { connect, Message, Channel, Connection } from 'amqplib/callback_api'

export type ConsumerFunc = (msg: Message | null) => void;

class RabbitMQ {
    private readonly connectionUrl: string;
    private _channel: Channel | null = null;
    private connection: Connection | null = null;

    constructor(connectionUrl: string) {
        this.connectionUrl = connectionUrl;
    }

    async createConnection () {
        return new Promise((resolve, reject) => {
            connect(this.connectionUrl,{
                heartbeat: 2
            },(err, connection) => {
                if (err) reject(new Error("Error making connection to rabbitmq", {
                    cause: err
                }));

                this.connection = connection;
                this.connection.createChannel((err, channel) => {
                    if (err) reject(new Error("Error creating channel", {
                        cause: err
                    }));
                    this._channel = channel;
                    resolve(undefined);
                });
            });
        });
    }

    async createListeningExchangeByTopic (exchangeName: string, topics: string[], consumeFunc: ConsumerFunc) {
        return new Promise((resolve, reject) => {
            if (!this.connection) reject(new Error("No connection to message broker"));
            if (!this._channel) reject(new Error("No channel has been created yet"));

            this._channel?.assertExchange(exchangeName, 'topic', {
                durable: true
            }, (err) => {
                if (err) reject(new Error("Error asserting topic exchange", { cause: err }));
                this.channel?.assertQueue("", {
                    exclusive: true
                }, (err, replies) => {
                    if (err) reject(new Error(`Error asserting to queue`, {
                        cause: err
                    }));

                    console.log("[*] Waiting to for messages....");

                    //Bind to the topics the generated queue
                    topics.forEach(topic => {
                        this._channel?.bindQueue(replies.queue, exchangeName, topic, null, (err, ok) => {
                            if (err) reject(new Error(`Error binding to queue: ${replies.queue}`, {
                                cause: err
                            }));
                        });
                    });
                    this._channel?.consume(replies.queue, consumeFunc, {
                        noAck: true
                    }, (err, ok) => {
                        if (err) reject(new Error(`Error consuming messages from queue: ${replies.queue}`, {
                            cause: err
                        }));
                        resolve(undefined);
                    });
                });
            });
        });
    }
    async publishMessageToExchange (exchangeName: string, topicKey: string, msg: any) {
        return new Promise((resolve, reject) => {
            if (!this.connection) reject(new Error("No connection to message broker"));
            if (!this._channel) reject(new Error("No message broker channel created"));

            this._channel?.assertExchange(exchangeName, 'topic', {
                durable: true
            }, (err, replies) => {
                if (err) reject(new Error("Error asserting topic exchange", { cause: err }));
                resolve(this._channel?.publish(exchangeName, topicKey, Buffer.from(msg)));
            });
        });
    }

    async closeConnection () {
        return new Promise((resolve, reject) => {
            if (!this.connection) reject(new Error("No connection established to message broker"));
            this.connection?.close((err) => {
                if (err) reject(new Error("Error closing connection", {
                    cause: err
                }));
                resolve(undefined);
            });
        });
    }

    get channel(): Channel | null {
        return this._channel;
    }
}

export default RabbitMQ;