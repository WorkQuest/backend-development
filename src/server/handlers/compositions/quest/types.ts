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

/** Results */

export type CreateQuestComposResults = Promise<Quest>;
