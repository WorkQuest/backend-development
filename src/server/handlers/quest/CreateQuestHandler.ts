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
import { UserValidator } from '../user';

export interface CreateQuestCommand {
  questCreator: User;
  workplace: WorkPlace;
  payPeriod: PayPeriod;
  typeOfEmployment: QuestEmployment;
  priority: Priority;
  title: string;
  description: string;
  price: string;

  medias: Media[];

  locationFull: {
    location: LocationType;
    locationPlaceName: string;
  };
}

interface CreateQuestPayload extends CreateQuestCommand {};

export class CreateQuestHandler extends BaseDomainHandler<CreateQuestCommand, Promise<Quest>> {
  private static async createQuest(payload: CreateQuestPayload, options: Options = {}): Promise<Quest> {
    const avatarModel = payload.medias.length === 0 ? null : payload.medias[0];

    const quest = await Quest.create(
      {
        avatarId: avatarModel?.id,
        userId: payload.questCreator.id,
        status: QuestStatus.Pending,
        workplace: payload.workplace,
        payPeriod: payload.payPeriod,
        typeOfEmployment: payload.typeOfEmployment,
        priority: payload.priority,
        title: payload.title,
        description: payload.description,
        price: payload.price,
        location: payload.locationFull.location,
        locationPlaceName: payload.locationFull.locationPlaceName,
        locationPostGIS: transformToGeoPostGIS(payload.locationFull.location),
      },
      { transaction: options.tx },
    );

    await quest.$set('medias', payload.medias, {
      transaction: options.tx,
    });

    return quest;
  }

  public async Handle(command: CreateQuestCommand): Promise<Quest> {
    return await CreateQuestHandler.createQuest({ ...command }, { tx: this.options.tx });
  }
}

export class CreateQuestEmployerPreValidationHandler extends BaseDecoratorHandler<CreateQuestCommand, Promise<Quest>> {
  private readonly userValidator: UserValidator;

  constructor(protected readonly decorated: IHandler<CreateQuestCommand, Promise<Quest>>) {
    super(decorated);

    this.userValidator = new UserValidator();
  }

  public Handle(command: CreateQuestCommand): Promise<Quest> {
    this.userValidator.MustBeEmployer(command.questCreator);

    return this.decorated.Handle(command);
  }
}
