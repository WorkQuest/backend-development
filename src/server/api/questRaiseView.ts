import { UserController } from "../controllers/user/controller.user";
import { QuestController } from "../controllers/quest/controller.quest";
import { output } from "../utils";
import {
  User,
  Quest,
  UserRole,
  QuestRaiseView,
} from "@workquest/database-models/lib/models";

//TODO: проверка на то, вышел срок подписки или нет
export async function createRaiseView(r) {
  const employer: User = r.auth.credentials;
  const userController = new UserController(employer);

  const questController = new QuestController(await Quest.findByPk(r.params.questId));

  questController
    .employerMustBeQuestCreator(employer.id);

  await questController.checkQuestRaiseViews();

  await QuestRaiseView.create({
    questId: r.params.questId,
    userId: r.auth.credentials.id,
    duration: r.payload.duration,
    type: r.payload.type,
  });

  const questRaiseSchema = await QuestRaiseView.create({
    questId: r.params.questId,
    userId: r.auth.credentials.id,
    duration: r.payload.duration,
    type: r.payload.type,
  });
  return output(questRaiseSchema);
}
