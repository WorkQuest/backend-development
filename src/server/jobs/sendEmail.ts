import { addJob } from '../utils/scheduler';
import * as nodemailer from 'nodemailer';
import config from '../config/config';

const transporter = nodemailer.createTransport(config.smtp);

// TODO use templates and data
export interface SendEmailPayload {
  email: string;
  text: string;
  subject: string;
  html: string;
}

export async function addSendEmailJob(payload: SendEmailPayload) {
  return addJob('sendEmail', payload, { max_attempts: 25 });
}

export default async function (p: SendEmailPayload) {
  await transporter.sendMail({
    from: config.smtp.sender,
    to: p.email,
    subject: p.subject,
    text: p.text,
    html: p.html,
  });
}
