import { BaseCompositeHandler } from '../../types';
import { ChangeUserPasswordComposCommand, ChangeUserPasswordComposResult } from "./types";
import {
  ChangeUserPasswordHandler,
  LogoutOtherSessionsHandler,
  GetUserByIdWithFullAccessHandler,
  GetUserByIdPostValidationHandler,
  GetUserByIdPostAccessPermissionHandler,
  ChangeUserPasswordPreAccessPermissionHandler,
} from '../../user';

export class ChangeUserPasswordComposHandler extends BaseCompositeHandler<ChangeUserPasswordComposCommand, ChangeUserPasswordComposResult> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  public async Handle(command: ChangeUserPasswordComposCommand): ChangeUserPasswordComposResult {
    const user = await new GetUserByIdPostAccessPermissionHandler(
       new GetUserByIdPostValidationHandler(
         new GetUserByIdWithFullAccessHandler()
       )
    ).Handle({ userId: command.user.id })

    await this.dbContext.transaction(async (tx) => {
      await new ChangeUserPasswordPreAccessPermissionHandler(
        new ChangeUserPasswordHandler().setOptions({ tx })
      ).Handle({ ...command, user })

      await new LogoutOtherSessionsHandler().setOptions({ tx })
        .Handle({ user, currentSession: command.currentSession, })
    });
  }
}
