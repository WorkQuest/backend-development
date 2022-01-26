import {UserController} from "../controllers/user/controller.user";
import {output} from "../utils";
import {UserRaiseView, User, UserRole} from "@workquest/database-models/lib/models";

//TODO: проверка на то, вышел срок подписки или нет
export async function activateRaiseView(r) {
  const worker: User = r.auth.credentials;
  const userController = new UserController(worker);
  userController.userMustHaveRole(UserRole.Worker);

  await UserRaiseView.update({
    duration: r.payload.duration,
    type: r.payload.type,
  }, {
    where: {
      userId: r.params.questId
    }
  });

  return output();
}

//TODO: сделать оплату
