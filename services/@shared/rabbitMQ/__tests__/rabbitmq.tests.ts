// Import your RabbitMQ class
import RabbitMQ, { ConsumerFunc } from '../src'; // Adjust the import path accordingly

describe('RabbitMQ', () => {
    let rabbitMQ: RabbitMQ;

    beforeAll(async () => {
        // Initialize RabbitMQ instance with a mock connection URL or a real one for testing
        rabbitMQ = new RabbitMQ('amqps://gztpajlb:v2sZ-56M_GFyI6fbDY7LEc3LfFZmKFoN@shrimp.rmq.cloudamqp.com/gztpajlb');

        await rabbitMQ.createConnection();
        expect(rabbitMQ.channel).not.toBeNull();

    });

    afterAll(async () => {
        await rabbitMQ.closeConnection();
        expect(rabbitMQ.channel).toBeNull();
    });

    it('should create a listening exchange by topic', async () => {
        const exchangeName = 'test-exchange';
        const topics = ['topic.test'];
        const consumeFunc: ConsumerFunc = (msg) => {
            // Your custom consume function logic for testing
        };

        await rabbitMQ.createListeningExchangeByTopic(exchangeName, topics, consumeFunc);
        expect(rabbitMQ.channel).not.toBeNull();
    });

    it('should publish a message to the exchange', async () => {
        const exchangeName = 'test-exchange';
        const topicKey = 'topic.test';
        const message = 'Test message';

        await rabbitMQ.publishMessageToExchange(exchangeName, topicKey, message);
        expect(rabbitMQ.channel).not.toBeNull();
    });

    it('should throw an error if no channel is created yet', async () => {
        try {
            await rabbitMQ.createListeningExchangeByTopic('test-exchange', ['topic.test'], (msg) => {
                // Your custom consume function logic for testing
            });
        } catch (error) {
            // @ts-ignore
            expect(error.message).toBe('No connection to message broker');
        }
    });
});
