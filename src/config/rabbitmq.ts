import amqp from 'amqplib';

let channel: amqp.Channel | null = null;

const connectRabbitMQ = async (): Promise<amqp.Channel | null> => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL as string);
    const newChannel = await connection.createChannel();

    // Create necessary exchanges and queues
    await newChannel.assertExchange('auth', 'topic', { durable: true });

    channel = newChannel;
    console.log('RabbitMQ Connected');
    return newChannel;
  } catch (error) {
    console.error(
      `Error connecting to RabbitMQ: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return null;
  }
};

const getChannel = (): amqp.Channel | null => {
  return channel;
};

const publishMessage = (
  exchange: string,
  routingKey: string,
  message: any
): void => {
  try {
    const currentChannel = getChannel();

    if (!currentChannel) {
      console.warn(`Message not published: RabbitMQ not connected`);
      return;
    }

    currentChannel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    console.log(
      `Message published to ${exchange} with routing key ${routingKey}`
    );
  } catch (error) {
    console.error(
      `Error publishing message: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};

export { connectRabbitMQ, getChannel, publishMessage };
