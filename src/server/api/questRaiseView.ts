import { UserController } from "../controllers/user/controller.user";
import { QuestController } from "../controllers/quest/controller.quest";
import { output } from "../utils";
import { Quest, QuestRaiseView, User, UserRole } from "@workquest/database-models/lib/models";

//TODO: проверка на то, вышел срок подписки или нет
export async function createRaiseView(r) {
  const employer: User = r.auth.credentials;
  const userController = new UserController(employer);
  userController.userMustHaveRole(UserRole.Employer);

  const questController = new QuestController(await Quest.findByPk(r.params.questId));

  questController
    .employerMustBeQuestCreator(employer.id);

  await questController.checkQuestRaiseViews();

  const questRaiseView = await QuestRaiseView.create({
    questId: r.params.questId,
    userId: r.auth.credentials.id,
    duration: r.payload.duration,
    type: r.payload.type,
  });

  return output(questRaiseView);
}

//TODO: сделать оплату
