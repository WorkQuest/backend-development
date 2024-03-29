import { ReportValidator } from './ReportValidator';
import { BaseDecoratorHandler, IHandler } from '../types';
import {
  User,
  Quest,
  reportEntities,
  ReportEntityType,
  DiscussionComment,
} from '@workquest/database-models/lib/models';


export interface GetEntityForReportCommand {
  readonly entityId: string;
  readonly entityType: ReportEntityType;
}

export type EntityReport =
  | User
  | Quest
  | DiscussionComment

export class GetEntityForReportHandler implements IHandler<GetEntityForReportCommand, Promise<EntityReport>> {
  public async Handle(command: GetEntityForReportCommand): Promise<EntityReport> {
    const entityObject = reportEntities[command.entityType] as unknown as { entity: EntityReport, statuses: any };

    return await entityObject.entity['findByPk'].call(entityObject.entity, command.entityId) as EntityReport;
  }
}

export class GetEntityForReportPreValidateHandler extends BaseDecoratorHandler<GetEntityForReportCommand, Promise<EntityReport>> {

  private readonly validator: ReportValidator;

  constructor(
    protected readonly decorated: IHandler<GetEntityForReportCommand, Promise<EntityReport>>,
  ) {
    super(decorated);

    this.validator = new ReportValidator();
  }

  public async Handle(command: GetEntityForReportCommand): Promise<EntityReport> {
    this.validator.hasEntity(command.entityType);

    return this.decorated.Handle(command);
  }
}

export class GetEntityForReportPostValidateHandler extends BaseDecoratorHandler<GetEntityForReportCommand, Promise<EntityReport>> {

  private readonly validator: ReportValidator;

  constructor(
    protected readonly decorated: IHandler<GetEntityForReportCommand, Promise<EntityReport>>,
  ) {
    super(decorated);

    this.validator = new ReportValidator();
  }

  public async Handle(command: GetEntityForReportCommand): Promise<EntityReport> {
    const entity = await this.decorated.Handle(command);

    this.validator.isEntityExist(entity);

    return entity;
  }
}
