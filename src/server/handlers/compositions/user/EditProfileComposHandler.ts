import { BaseCompositeHandler } from '../../types';
import { User, UserRole, Media } from '@workquest/database-models/lib/models';
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
import {
  SetQuestSpecializationHandler,
  SetSpecializationPreValidationHandler,
  SetUserSpecializationHandler,
} from '../../specializations/SetSpecialization';

export class EditProfileComposHandler extends BaseCompositeHandler<EditProfileCommand, EditProfileResult> {
  constructor(
    protected readonly dbContext: any,
  ) {
    super(dbContext);
  }

  private async editEmployer(command: EditProfileCommand): EditProfileResult {
    let avatar: Media | null = null;

    if (command.avatarId) {
      avatar = await new GetMediaPostValidationHandler(
        new GetMediaByIdHandler()
      ).Handle({ mediaId: command.avatarId });
    }

    return this.dbContext.transaction(async (tx) => {
      const [editableUser, employerProfileVisibilitySetting] = await new EditEmployerProfilePreValidateHandler(
        new EditEmployerProfileHandler().setOptions({ tx })
      ).Handle({ avatar, ...command as EditEmployerProfileCommand });

      editableUser.setDataValue('employerProfileVisibilitySetting', employerProfileVisibilitySetting);

      return [editableUser, employerProfileVisibilitySetting];
    });
  }

  private async editWorker(command: EditProfileCommand): EditProfileResult {
    let avatar: Media | null = null;

    if (command.avatarId) {
      avatar = await new GetMediaPostValidationHandler(
        new GetMediaByIdHandler()
      ).Handle({ mediaId: command.avatarId });
    }


    return this.dbContext.transaction(async (tx) => {
      const [editableUser, workerProfileVisibilitySetting, userSpecializations] = await new EditWorkerProfilePreValidateHandler(
        new EditWorkerProfileHandler().setOptions({ tx })
      ).Handle({ avatar, ...command as EditWorkerProfileCommand });

      await new SetSpecializationPreValidationHandler(new SetUserSpecializationHandler().setOptions({ tx }))
        .Handle({
          userId: editableUser.id,
          keys: command.specializationKeys as any,
        });

      editableUser.setDataValue('userSpecializations', userSpecializations);
      editableUser.setDataValue('workerProfileVisibilitySetting', workerProfileVisibilitySetting);

      return editableUser;
    });

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
