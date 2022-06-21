import { BaseDecoratorHandler, IHandler } from '../types';
import { ReportAccessPermission } from './ReportAccessPermission';
import {
  User,
  Media,
  Quest,
  Report,
  ReportStatus,
  ReportEntityType,
  DiscussionComment,
} from '@workquest/database-models/lib/models';

export interface SendReportCommand {
  readonly author: User;
  readonly title: string;
  readonly description: string;
  readonly medias: ReadonlyArray<Media>;
  readonly entityType: ReportEntityType;
  readonly entity: User | DiscussionComment | Quest;
}

export class SendReportPreAccessPermission extends BaseDecoratorHandler<SendReportCommand, Promise<Report>> {
  private readonly accessPermission: ReportAccessPermission;

  constructor(
    protected readonly decorated: IHandler<SendReportCommand, Promise<Report>>,
  ) {
    super(decorated);

    this.accessPermission = new ReportAccessPermission();
  }

  public async Handle(command: SendReportCommand): Promise<Report> {
    this.accessPermission.NotSendReportYourself(command.author, command.entity, command.entityType);

    return this.decorated.Handle(command);
  }
}

export class SendReportHandler implements IHandler<SendReportCommand, Promise<Report>> {

  constructor(
    private readonly dbContext,
  ) {
  }

  public async Handle(command: SendReportCommand): Promise<Report> {
    return await this.dbContext.transaction(async (tx) => {
      const report = await Report.create({
        title: command.title,
        authorId: command.author.id,
        entityId: command.entity.id,
        status: ReportStatus.Created,
        entityType: command.entityType,
        description: command.description,
      }, { transaction: tx });

      await report.$set('medias', command.medias as Media[], { transaction: tx });

      return report;
    });
  }
}
