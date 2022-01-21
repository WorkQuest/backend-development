import amqp from 'amqplib/callback_api';
import config from "../config/config.common";

export function initRabbitMQ() {
  return amqp.connect(config.notificationMessageBroker.link, (connectError, conn) => {
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

    console.log('Bridge message broker connected');

    return channel;
  })
}

export class BridgeBroker {
  private channel = initRabbitMQ();

  private convertData(data: object): Buffer {
    const stringData = JSON.stringify(data);

    return Buffer.from(stringData);
  }

  public sendBridgeNotification(data: object): void {
    if (!this.channel) return;

    const convertedData = this.convertData(data);

    this.channel.sendToQueue('bridge', convertedData);
  }
}

export const BridgeMessageBroker = new BridgeBroker();
