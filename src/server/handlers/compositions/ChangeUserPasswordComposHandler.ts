import { BaseCompositeHandler } from '../types';
import { LogoutAllSessionsHandler } from '../user/LogoutAllSessionsHandler';
import { ChangeUserPasswordResult, ChangeUserPasswordCommand } from './types';
import {
  GetUserByIdPostValidationHandler,
  GetUserByIdWithFullAccessHandler,
  GetUserByIdPostAccessPermissionHandler,
} from '../user';
import {
  ChangeUserPasswordHandler,
  ChangeUserPasswordPreAccessPermissionHandler,
} from '../user/ChangeUserPasswordHandler';

export class ChangeUserPasswordComposHandler extends BaseCompositeHandler<ChangeUserPasswordCommand, ChangeUserPasswordResult> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: ChangeUserPasswordCommand): ChangeUserPasswordResult {
    const user = await new GetUserByIdPostAccessPermissionHandler(
       new GetUserByIdPostValidationHandler(
         new GetUserByIdWithFullAccessHandler()
       )
    ).Handle({ userId: command.user.id })

    await this.dbContext.transaction(async (tx) => {
      await new ChangeUserPasswordPreAccessPermissionHandler(
        new ChangeUserPasswordHandler().setOptions({ tx })
      ).Handle({ ...command, user })

      await new LogoutAllSessionsHandler().setOptions({ tx })
        .Handle({ user })
    });
  }
}
