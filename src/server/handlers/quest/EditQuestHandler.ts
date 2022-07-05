import { BaseDecoratorHandler, BaseDomainHandler, IHandler, Options } from '../types';
import { Priority, QuestEmployment } from '@workquest/database-models/src/models';
import { transformToGeoPostGIS } from '../../utils/postGIS';
import {
  LocationType,
  Media,
  PayPeriod,
  Quest,
  QuestStatus,
  User,
  WorkPlace,
} from '@workquest/database-models/lib/models';
import { GetUsersByIdCommand, GetUsersByIdResult, UserAccessPermission, UserValidator } from "../user";

export interface EditQuestEmployerCommand {
  questCreator: User;
  quest: Quest;
}

export interface EditQuestCommand {
  questCreator: User;
  quest: Quest;

  priority: Priority;
  workplace: WorkPlace;
  payPeriod: PayPeriod;
  typeOfEmployment: QuestEmployment;

  medias: Media[];

  locationFull: {
    location: LocationType;
    locationPlaceName: string;
  };
}

interface EditQuestPayload extends EditQuestCommand {};

export class EditQuestHandler extends BaseDomainHandler<EditQuestCommand, Promise<void>> {
  private static async editQuest(payload: EditQuestPayload, options: Options = {}): Promise<void> {
    const avatarModel = payload.medias.length === 0 ? null : payload.medias[0];

    await payload.quest.update(
      {
        avatarId: avatarModel?.id,
        priority: payload.priority,
        workplace: payload.workplace,
        payPeriod: payload.payPeriod,
        typeOfEmployment: payload.typeOfEmployment,
        location: payload.locationFull.location,
        locationPlaceName: payload.locationFull.locationPlaceName,
        locationPostGIS: transformToGeoPostGIS(payload.locationFull.location),
      },
      {
        transaction: options.tx
      },
    );

    await payload.quest.$set('medias', payload.medias, {
      transaction: options.tx,
    });

  }

  public async Handle(command: EditQuestCommand): Promise<void> {
    await EditQuestHandler.editQuest({ ...command }, { tx: this.options.tx });
  }
}

export class EditQuestEmployerPreValidationHandler extends BaseDecoratorHandler<EditQuestCommand, Promise<void>> {
  private readonly userValidator: UserValidator;

  constructor(protected readonly decorated: IHandler<EditQuestCommand, Promise<void>>) {
    super(decorated);

    this.userValidator = new UserValidator();
  }

  public Handle(command: EditQuestCommand): Promise<void> {
    this.userValidator.MustBeEmployer(command.questCreator);
    this.userValidator.MustBeQuestOwner(command.quest, command.questCreator.id);

    return this.decorated.Handle(command);
  }
}
