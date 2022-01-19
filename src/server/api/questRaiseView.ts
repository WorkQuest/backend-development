import {UserController} from "../controllers/user/controller.user";
import {QuestController} from "../controllers/quest/controller.quest";
import {output} from "../utils";
import {Quest, QuestRaiseView, User, UserRole} from "@workquest/database-models/lib/models";
import {Op} from "sequelize";

//TODO: проверка на то, вышел срок подписки или нет
export async function createRaiseView(r) {
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

//TODO: сделать оплату
