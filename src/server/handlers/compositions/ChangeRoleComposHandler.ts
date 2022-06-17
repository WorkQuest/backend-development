import { BaseCompositeHandler } from '../types';
import { ChangeRoleCommand, ChangeRoleResult } from './types';
import { UserRole } from '@workquest/database-models/lib/models';
import {
  ChangeRoleFromWorkerHandler,
  ChangeRoleFromEmployerHandler,
  GetUserByIdWithFullAccessHandler,
  GetUserByIdPostValidationHandler,
  ChangeRoleFromWorkerPreValidateHandler,
  GetUserByIdPostAccessPermissionHandler,
  ChangeRoleFromEmployerPreValidateHandler,
  ChangeRoleFromWorkerPreAccessPermissionHandler,
  ChangeRoleFromEmployerPreAccessPermissionHandler,
} from '../user';


interface ChangeFromWorkerPayload extends ChangeRoleCommand {

}

interface ChangeFromEmployerPayload extends ChangeRoleCommand {

}

export class ChangeRoleComposHandler extends BaseCompositeHandler<ChangeRoleCommand, ChangeRoleResult> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  private async changeFromWorker(payload: ChangeFromWorkerPayload) {
    await this.dbContext.transaction(async (tx) => {
      await new ChangeRoleFromWorkerPreValidateHandler(
        new ChangeRoleFromWorkerPreAccessPermissionHandler(
          new ChangeRoleFromWorkerHandler().setOptions(tx)
        )
      ).Handle(payload)
    });
  }

  private async changeFromEmployer(payload: ChangeFromEmployerPayload) {
    await this.dbContext.transaction(async (tx) => {
      await new ChangeRoleFromEmployerPreValidateHandler(
        new ChangeRoleFromEmployerPreAccessPermissionHandler(
          new ChangeRoleFromEmployerHandler().setOptions(tx)
        )
      ).Handle(payload)
    });
  }

  public async Handle(command: ChangeRoleCommand): ChangeRoleResult {
    const user = await new GetUserByIdPostAccessPermissionHandler(
      new GetUserByIdPostValidationHandler(
        new GetUserByIdWithFullAccessHandler()
      )
    ).Handle({ userId: command.user.id })

    if (user.role === UserRole.Employer) {
      await this.changeFromEmployer({ ...command, user });
    }
    if (user.role === UserRole.Worker) {
      await this.changeFromWorker({ ...command, user });
    }
  }
}
