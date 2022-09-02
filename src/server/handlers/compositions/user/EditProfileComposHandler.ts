import { BaseCompositeHandler } from '../../types';
import { UserRole } from '@workquest/database-models/lib/models';
import { GetMediaByIdHandler, GetMediaPostValidationHandler } from '../../media';
import {
  EditProfileResult,
  EditProfileCommand,
} from './types';
import {
  EditWorkerProfileResult,
  EditWorkerProfileHandler,
  EditEmployerProfileResult,
  EditEmployerProfileHandler,
  EditWorkerProfilePreValidateHandler,
  EditEmployerProfilePreValidateHandler,
  EditWorkerProfilePreAccessPermissionHandler,
  EditEmployerProfilePreAccessPermissionHandler,
} from '../../user';

export class EditProfileComposHandler extends BaseCompositeHandler<EditProfileCommand, EditProfileResult> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  private async editEmployer(command: EditProfileCommand): EditEmployerProfileResult {
    const editEmployerProfileCommand: any = command;

    if (command.profile.avatarId) {
      editEmployerProfileCommand.profile.avatar = await new GetMediaPostValidationHandler(
        new GetMediaByIdHandler()
      ).Handle({ mediaId: command.profile.avatarId })
    }

    return this.dbContext.transaction(async (tx) => {
      return await new EditEmployerProfilePreValidateHandler(
        new EditEmployerProfilePreAccessPermissionHandler(
          new EditEmployerProfileHandler().setOptions({ tx })
        )
      ).Handle(editEmployerProfileCommand)
    });
  }

  private async editWorker(command: EditProfileCommand): EditWorkerProfileResult {
    const editWorkerProfileCommand: any = command;

    if (command.profile.avatarId) {
      editWorkerProfileCommand.profile.avatar = await new GetMediaPostValidationHandler(
        new GetMediaByIdHandler()
      ).Handle({ mediaId: command.profile.avatarId });
    }

    if (command.profile.editableRole === UserRole.Worker) {
      return this.dbContext.transaction(async (tx) => {
        return await new EditWorkerProfilePreValidateHandler(
          new EditWorkerProfilePreAccessPermissionHandler(
            new EditWorkerProfileHandler().setOptions({ tx })
          )
        ).Handle(editWorkerProfileCommand)
      });
    }
  }

  public async Handle(command: EditProfileCommand): EditProfileResult {
    if (command.profile.editableRole === UserRole.Employer) {
      return this.editEmployer(command);
    }
    if (command.profile.editableRole === UserRole.Worker) {
      return this.editWorker(command);
    }
  }
}
