import { BaseCompositeHandler } from '../../types';
import { UserRole, Media } from '@workquest/database-models/lib/models';
import { GetMediaByIdHandler, GetMediaPostValidationHandler } from '../../media';
import {
  EditProfileResult,
  EditProfileCommand,
  EditWorkerProfileCommand,
  EditEmployerProfileCommand,
} from './types';
import {
  EditWorkerProfileResult,
  EditWorkerProfileHandler,
  EditEmployerProfileResult,
  EditEmployerProfileHandler,
  EditWorkerProfilePreValidateHandler,
  EditEmployerProfilePreValidateHandler,
} from '../../user';

export class EditProfileComposHandler extends BaseCompositeHandler<EditProfileCommand, EditProfileResult> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  private async editEmployer(command: EditProfileCommand): EditWorkerProfileResult {
    let avatar: Media | null = null;

    if (command.avatarId) {
      avatar = await new GetMediaPostValidationHandler(
        new GetMediaByIdHandler()
      ).Handle({ mediaId: command.avatarId });
    }

    const [editableUser, workerProfileVisibilitySetting, userSpecializations] = this.dbContext.transaction(async (tx) => {
      await new EditEmployerProfilePreValidateHandler(
        new EditEmployerProfileHandler().setOptions({ tx })
      ).Handle({ avatar, ...command as EditEmployerProfileCommand })
    });

    return [editableUser, workerProfileVisibilitySetting, userSpecializations];
  }

  private async editWorker(command: EditProfileCommand): EditEmployerProfileResult {
    let avatar: Media | null = null;

    if (command.avatarId) {
      avatar = await new GetMediaPostValidationHandler(
        new GetMediaByIdHandler()
      ).Handle({ mediaId: command.avatarId });
    }

    if (command.editableRole === UserRole.Worker) {
      return this.dbContext.transaction(async (tx) => {
        return await new EditWorkerProfilePreValidateHandler(
          new EditWorkerProfileHandler().setOptions({ tx })
        ).Handle({ avatar, ...command as EditWorkerProfileCommand })
      });
    }
  }

  public async Handle(command: EditProfileCommand): EditProfileResult {
    if (command.editableRole === UserRole.Employer) {
      return this.editEmployer(command);
    }
    if (command.editableRole === UserRole.Worker) {
      return this.editWorker(command);
    }
  }
}
