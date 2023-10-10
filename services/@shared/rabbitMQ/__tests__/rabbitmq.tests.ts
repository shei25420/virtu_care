import RabbitMQ, { ConsumerFunc } from '../src'; // Adjust the import path as needed

describe('RabbitMQ', () => {
    let rabbitMQ: RabbitMQ;

    beforeAll((done) => {
        rabbitMQ = new RabbitMQ(`amqps://${process.env.RABBITMQ_DEV_USER}:${process.env.RABBITMQ_DEV_PASSWD}@${process.env.RABBITMQ_DEV_HOST}/${process.env.RABBITMQ_DEV_VHOST}`); // Replace with your RabbitMQ connection URL
        rabbitMQ.createConnection().then(() => {
            done();
        }).catch(err => {
            throw new Error(err);
        });
    });

    afterAll((done) => {
        rabbitMQ.closeConnection().then(() => {
            done();
        }).catch(err => {
            throw new Error(err);
        });
    });

    describe('createConnection', () => {
        it('should create a connection and a channel', async () => {
            expect(rabbitMQ.channel).toBeDefined();
        });
    });

    describe('createListeningExchangeByTopic', () => {
        it('should create a listening exchange and consume messages', async () => {
            const exchangeName = 'testExchange';
            const topics = ['topic1', 'topic2'];
            const consumeFunc: ConsumerFunc = (msg) => {
                expect(msg).not.toBeNull();
            };

            await rabbitMQ.createListeningExchangeByTopic(exchangeName, topics, consumeFunc);
            // Publish a message to the exchange for testing.
            await rabbitMQ.publishMessageToExchange(exchangeName, 'topic1', 'Test Message');
        });
    });

    describe('publishMessageToExchange', () => {
        it('should publish a message to the exchange', async () => {
            const exchangeName = 'testExchange';
            const topicKey = 'testKey';
            const msg = 'Test Message';

            // Subscribe to the exchange to receive the published message.
            const consumeFunc: ConsumerFunc = (receivedMsg) => {
                expect(receivedMsg).not.toBeNull();
                expect(receivedMsg!.content.toString()).toBe(msg);
            };
            await rabbitMQ.createListeningExchangeByTopic(exchangeName, [topicKey], consumeFunc);

            // Publish the message and wait for it to be consumed.
            await rabbitMQ.publishMessageToExchange(exchangeName, topicKey, msg);
        });
    });

    // You can add more test cases as needed for other methods and edge cases.

});
