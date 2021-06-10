import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, Model, Scopes, Table } from 'sequelize-typescript';
import { User } from "./User";
import { error, getUUID } from '../utils';
import { Media } from './Media';
import { QuestMedia } from './QuestMedia';
import { transformToGeoPostGIS } from '../utils/quest';
import { Errors } from '../utils/errors';

export enum QuestPriority {
  AllPriority = 0,
  Low,
  Normal,
  Urgent,
}

export enum AdType {
  Free = 0,
  Paid,
}

export enum QuestStatus {
  Created = 0,
  Active,
  Closed,
  Dispute,
  WaitWorker,
  WaitConfirm,
}

export interface Location {
  longitude: number;
  latitude: number;
}

@Scopes(() => ({
  defaultScope: {
    attributes: {
      exclude: ["locationPostGIS"]
    },
    include: [{
      model: Media.scope('urlOnly'),
      as: 'medias',
      through: {
        attributes: []
      }
    }]
  }
}))
@Table
export class Quest extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;
  @ForeignKey(() => User) @Column({type: DataType.STRING, allowNull: false}) userId: string;
  @ForeignKey(() => User) @Column({type: DataType.STRING, defaultValue: null}) assignedWorkerId: string;

  @Column({type: DataType.INTEGER, defaultValue: QuestStatus.Created }) status: QuestStatus;
  @Column({type: DataType.INTEGER, defaultValue: QuestPriority.AllPriority }) priority: QuestPriority;
  @Column({type: DataType.STRING, allowNull: false}) category: string;

  @Column({type: DataType.JSONB}) location: Location;
  @Column({type: DataType.GEOMETRY('POINT', 4326)}) locationPostGIS;
  @Column({type: DataType.STRING, allowNull: false }) title: string;
  @Column({type: DataType.TEXT }) description: string;

  @Column({type: DataType.DECIMAL, allowNull: false}) price: string;
  @Column({type: DataType.INTEGER, defaultValue: AdType.Free }) adType: AdType;

  @BelongsTo(() => User) user: User;
  @BelongsToMany(() => Media, () => QuestMedia) medias: Media[];

  updateFieldLocationPostGIS(): void {
    this.setDataValue('locationPostGIS', transformToGeoPostGIS(this.getDataValue('location')));
  }

  mustHaveStatus(status: QuestStatus) {
    if (this.status !== status) {
      throw error(Errors.InvalidStatus, "Quest isn't match status", {
        current: this.status,
        mustHave: status
      });
    }
  }

  mustBeQuestCreator(userId: String) {
    if (this.userId !== userId) {
      throw error(Errors.Forbidden, "User in not creator of quest", {
        current: this.userId,
        mustHave: userId
      });
    }
  }
}
