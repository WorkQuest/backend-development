import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from './User';
import { Quest } from './Quest';
import { error, getUUID } from '../utils';
import { Errors } from '../utils/errors';

export enum QuestsResponseStatus {
  Rejected = -1,
  Open = 0,
  Accepted,
  Closed,
}

export enum QuestsResponseType {
  Response = 0,
  Invite,
}

@Table
export class QuestsResponse extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;

  @ForeignKey(() => User) @Column(DataType.STRING) workerId: string;
  @ForeignKey(() => Quest) @Column(DataType.STRING) questId: string;

  @Column({type: DataType.INTEGER, defaultValue: QuestsResponseStatus.Open }) status: QuestsResponseStatus;
  @Column({type: DataType.INTEGER, defaultValue: QuestsResponseType.Response }) type: QuestsResponseType;

  @Column({type: DataType.TEXT }) message: string;

  @BelongsTo(() => User) worker: User;
  @BelongsTo(() => Quest) quest: Quest;

  mustBeInvitedToQuest(workerId: String): void {
    this.mustHaveType(QuestsResponseType.Invite);

    if (this.workerId !== workerId) {
      throw error(Errors.Forbidden, "User isn't invitation to quest", {});
    }
  }

  mustHaveStatus(status: QuestsResponseStatus): void {
    if (this.status !== status) {
      throw error(Errors.Forbidden, "Response on quest isn't match status", {
        mustHave: status,
        current: this.status,
      });
    }
  }

  mustHaveType(type: QuestsResponseType): void {
    if (this.type !== type) {
      throw error(Errors.Forbidden, "Quests response isn't match type", {
        mustHave: type,
        current: this.type,
      });
    }
  }
}
