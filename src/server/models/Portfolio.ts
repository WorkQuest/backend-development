import { BelongsToMany, Column, DataType, ForeignKey, Model, Scopes, Table } from 'sequelize-typescript';
import { error, getUUID } from '../utils';
import { User } from './User';
import { PortfolioMedia } from './PortfolioMedia';
import { Media } from './Media';
import { Errors } from '../utils/errors';

@Scopes(() => ({
  defaultScope: {
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
export class Portfolio extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;
  @ForeignKey(() => User) @Column({type: DataType.STRING, allowNull: false}) userId: string;

  @Column({type: DataType.STRING, allowNull: false }) title: string;
  @Column({type: DataType.TEXT }) description: string;

  @BelongsToMany(() => Media, () => PortfolioMedia) medias: Media[];

  mustBeCaseCreator(userId: String) {
    if (this.userId !== userId) {
      throw error(Errors.Forbidden, "User is not portfolio creator", {
        current: this.userId,
        mustHave: userId
      });
    }
  }
}
