import { output } from "../utils";
import { UserController } from "../controllers/user/controller.user";
import { QuestController } from "../controllers/quest/controller.quest";
import {
  Quest,
  QuestRaiseStatus,
  QuestRaiseView,
  QuestStatus,
  User,
  UserRole
} from "@workquest/database-models/lib/models";
import { updateQuestRaiseViewStatusJob } from "../jobs/updateQuestRaiseViewStatus";

export async function activateRaiseView(r) {
  const employer: User = r.auth.credentials;
  const userController = new UserController(employer);
  userController.userMustHaveRole(UserRole.Employer);

  const questController = new QuestController(await Quest.findByPk(r.params.questId));

  await questController
    .employerMustBeQuestCreator(employer.id)
    .questMustHaveStatus(QuestStatus.Created)
    .checkQuestRaiseViewStatus();

  await QuestRaiseView.update({ duration: r.payload.duration, type: r.payload.type, status: QuestRaiseStatus.Unpaid }, { where: { questId: r.params.questId } });

  return output();
}

export async function payForRaiseView(r) {
//TODO: логику оплаты
//TODO: проверку, заполнен ли тип и длительность
  const raiseView = await QuestRaiseView.findOne({
    where: {
      questId: r.params.questId
    }
  });

  const endOfRaiseView = new Date();
  endOfRaiseView.setDate(endOfRaiseView.getDate() + raiseView.duration);

  await  updateQuestRaiseViewStatusJob({
    questId: r.params.questId,
    runAt: endOfRaiseView
  });

  await raiseView.update({
    status: QuestRaiseStatus.Paid,
  });

  return output();
}
