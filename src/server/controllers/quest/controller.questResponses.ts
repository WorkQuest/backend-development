import { error } from '../../utils';
import { Transaction } from 'sequelize';
import { Errors } from '../../utils/errors';
import {
  User,
  Quest,
  Media,
  QuestsResponse,
  QuestsResponseType,
  QuestsResponseStatus,
} from '@workquest/database-models/lib/models';

interface SendBasePayload {
  readonly worker: User;
  readonly quest: Quest;

  readonly message: string;
}

export interface SendRequestPayload extends SendBasePayload {

}

export interface SendInvitePayload extends SendBasePayload {

}

export class QuestsInviteController {
  constructor(
    public readonly quest: Quest,
    public readonly worker: User,
    public readonly questInvite: QuestsResponse,
  ) {
  }

  toDto(): object {
    const questJson = this.quest.toJSON();
    const questResponseJson = this.questInvite.toJSON();

    questResponseJson['worker'] = {
      id: this.worker.id,
      firstName: this.worker.firstName,
      lastName: this.worker.lastName,
      avatar: this.worker.avatar,
      ratingStatistic: this.worker.ratingStatistic,
      raiseView: this.worker.raiseView,
      additionalInfo: this.worker.additionalInfo,
    };

    questResponseJson['quest'] = questJson;

    return questResponseJson;
  }

  public acceptInvitation(options: { tx?: Transaction } = {}): Promise<void> {
    return void this.questInvite.update({ status: QuestsResponseStatus.Accepted }, { transaction: options.tx });
  }

  public rejectInvitation(options: { tx?: Transaction } = {}): Promise<void> {
    return void this.questInvite.update({ status: QuestsResponseStatus.Rejected }, { transaction: options.tx });
  }

  public static async sendInvite(payload: SendInvitePayload, options: { tx?: Transaction } = {}): Promise<QuestsInviteController | never> {
    const isCreatedQuestResponse = await QuestsResponse.unscoped().findOne({
      attributes: ['id', 'type', 'status'],
      where: {
        questId: payload.quest.id,
        workerId: payload.worker.id,
      }
    });

    if (isCreatedQuestResponse) {
      throw error(Errors.AlreadyAnswer, 'User already answered this quest', { questResponse: isCreatedQuestResponse });
    }

    const questInvite = await QuestsResponse.create({
      workerId: payload.worker.id,
      questId: payload.quest.id,
      message: payload.message,
      status: QuestsResponseStatus.Open,
      previousStatus: QuestsResponseStatus.Open,
      type: QuestsResponseType.Invite,
    }, { transaction: options.tx });

    return new QuestsInviteController(
      payload.quest,
      payload.worker,
      questInvite,
    );
  }
}

export class QuestResponseController {
  constructor(
    public readonly quest: Quest,
    public readonly worker: User,
    public readonly questResponse: QuestsResponse,
  ) {
  }

  toDto(): object {
    const questJson = this.quest.toJSON();
    const questResponseJson = this.questResponse.toJSON();

    questResponseJson['worker'] = {
      id: this.worker.id,
      firstName: this.worker.firstName,
      lastName: this.worker.lastName,
      avatar: this.worker.avatar,
      ratingStatistic: this.worker.ratingStatistic,
      raiseView: this.worker.raiseView,
      additionalInfo: this.worker.additionalInfo,
    };

    questResponseJson['quest'] = questJson;

    return questResponseJson;
  }

  public setMedias(medias: Media[], options: { tx?: Transaction } = {}) {
    return this.questResponse.$set('medias', medias, { transaction: options.tx });
  }

  public rejectRequest(options: { tx?: Transaction } = {}): Promise<void> {
    return void this.questResponse.update({ status: QuestsResponseStatus.Rejected }, { transaction: options.tx });
  }

  public static async sendRequest(payload: SendRequestPayload, options: { tx?: Transaction } = {}): Promise<QuestResponseController | never> {
    const isCreatedQuestResponse = await QuestsResponse.unscoped().findOne({
      attributes: ['id', 'type', 'status'],
      where: {
        questId: payload.quest.id,
        workerId: payload.worker.id,
      }
    });

    if (isCreatedQuestResponse) {
      throw error(Errors.AlreadyAnswer, 'You already answered quest', { questResponse: isCreatedQuestResponse });
    }

    const questResponse = await QuestsResponse.create({
      questId: payload.quest.id,
      workerId: payload.worker.id,
      message: payload.message,
      status: QuestsResponseStatus.Open,
      type: QuestsResponseType.Response,
    }, { transaction: options.tx });

    return new QuestResponseController(
      payload.quest,
      payload.worker,
      questResponse,
    );
  }
}
