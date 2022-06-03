import { ReportValidator } from './ReportValidator';
import { HandlerDecoratorBase, IHandler } from '../types';
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

export class GetEntityForReportPreValidateHandler extends HandlerDecoratorBase<GetEntityForReportCommand, Promise<EntityReport>> {

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

export class GetEntityForReportHandler implements IHandler<GetEntityForReportCommand, Promise<EntityReport>> {
  public async Handle(command: GetEntityForReportCommand): Promise<EntityReport> {
    const entityObject = reportEntities[command.entityType] as unknown as { entity: EntityReport, statuses: any };

    return await entityObject.entity['findByPk'].call(command.entityId) as EntityReport;
  }
}
