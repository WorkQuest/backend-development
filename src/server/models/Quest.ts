import { BelongsTo, Column, DataType, ForeignKey, Model, Scopes, Table } from 'sequelize-typescript';
import { User } from "./User";
import { getUUID } from '../utils';
import BigNumber from 'bignumber.js';

export enum Priority {
  AllPriority = 0,
  Low,
  Normal,
  Urgent,
};

export enum AdType {
  Free = 0,
  Paid,
};

export interface Location {
  longitude: number;
  latitude: number;
};

function transformToGeoPostGIS(location: Location) {
  const coordinates = [location.longitude, location.latitude];

  return {
    type: "Point",
    coordinates: coordinates,
  };
}

@Scopes(() => ({
  defaultScope: {
    attributes: {
      exclude: ["locationPostGIS"]
    }
  }
}))
@Table
export class Quest extends Model {
  @Column({ primaryKey: true, type: DataType.STRING, defaultValue: () => getUUID() }) id: string;
  @ForeignKey(() => User) @Column(DataType.STRING) userId: string;

  @Column({type: DataType.INTEGER, defaultValue: Priority.AllPriority }) priority: Priority;
  @Column({type: DataType.STRING, allowNull: false }) category: string;

  @Column({type: DataType.JSONB,
    set(value: Location) {
      this.setDataValue("locationPostGIS", transformToGeoPostGIS(value));
      this.setDataValue("location", value);
    }
  }) location: Location;
  @Column({type: DataType.GEOMETRY('POINT', 4326)}) locationPostGIS;
  @Column({type: DataType.STRING }) title: string;
  @Column({type: DataType.TEXT }) description: string;

  @Column({type: DataType.DECIMAL}) price: BigNumber;
  @Column({type: DataType.INTEGER, defaultValue: AdType.Free }) adType: AdType;

  @BelongsTo(() => User) user: User;
}
