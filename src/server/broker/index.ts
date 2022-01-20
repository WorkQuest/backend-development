import amqp from 'amqplib/callback_api';
import config from "../config/config";

export function initRabbitMQ() {
  return amqp.connect(config.broker.link , (connectError, conn) => {
    if (connectError) {
      console.error(connectError.message);
    }

    conn.on('error', (connectionError) => {
      console.error(connectionError.message);
    });

    conn.on('close', () => {
      setTimeout(() => {
        initRabbitMQ();
      }, 5000);
    });

    const channel = conn.createChannel((channelError, channel) => {
      if (channelError) {
        console.error(channelError.message);
      }

      return channel;
    });

    console.log('Message broker connected');

    return channel;
  })
}
