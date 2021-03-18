import { Column, DataType, Model, Scopes, Table } from "sequelize-typescript";
import { getUUID } from "../utils";

@Scopes(() => ({
  defaultScope: {
    attributes: {
      exclude: ["createdAt", "updatedAt"]
    }
  }
}))
@Table
export class Point extends Model {
  @Column({ type: DataType.STRING, defaultValue: getUUID, primaryKey: true }) id: string;
  @Column(DataType.DECIMAL) latitude: string;
  @Column(DataType.DECIMAL) longitude: string;
  @Column(DataType.STRING) text: string;
}
