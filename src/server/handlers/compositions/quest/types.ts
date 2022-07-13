import { User, Quest, PayPeriod, WorkPlace, LocationType } from '@workquest/database-models/lib/models';
import { Priority, QuestEmployment } from '@workquest/database-models/src/models';

/** Commands */

export interface CreateQuestComposCommand {
  questCreatorId: string;
  workplace: WorkPlace;
  payPeriod: PayPeriod;
  typeOfEmployment: QuestEmployment;
  priority: Priority;
  title: string;
  description: string;
  price: string;
  mediaIds: string[];

  locationFull: {
    location: LocationType;
    locationPlaceName: string;
  };

  specializationKeys: string[];
}

export interface EditQuestComposCommand {
  questCreator: User;
  questId: string,

  priority: Priority;
  workplace: WorkPlace;
  payPeriod: PayPeriod;
  typeOfEmployment: QuestEmployment;
  mediaIds: string[];

  locationFull: {
    location: LocationType;
    locationPlaceName: string;
  };

  specializationKeys: string[];
}

export interface MarkQuestStarComposCommand {
  meUser: User,
  questId: string,
}

/** Results */

export type CreateQuestComposResults = Promise<Quest>;

export type EditQuestComposResults = Promise<Quest>;

export type MarkQuestStarComposResults = Promise<void>
