import cron from 'node-cron';
import {output} from "../utils";
import {UserController} from "../controllers/user/controller.user";
import {QuestController} from "../controllers/quest/controller.quest";
import {
  User,
  Quest,
  UserRole,
  QuestRaiseView,
} from "@workquest/database-models/lib/models";

export async function activateRaiseView(r) {
  const employer: User = r.auth.credentials;
  const userController = new UserController(employer);
  userController.userMustHaveRole(UserRole.Employer);

  const questController = new QuestController(await Quest.findByPk(r.params.questId));

  questController
    .employerMustBeQuestCreator(employer.id);

  await questController.checkQuestRaiseViews();

  await QuestRaiseView.update({
    duration: r.payload.duration,
    type: r.payload.type,
  }, {
    where: {
      questId: r.params.questId
    }
  });

  return output();
}

export async function payForRaiseView(r) {
//TODO: логику оплаты
  const raiseView = await QuestRaiseView.findOne({
    where: {
      questId: r.params.questId
    }
  });

  const endOfRaiseView = new Date(Date.now());

  cron.schedule(Date(), async () => {
  });

  return output();
}
