import { Filter } from "@workquest/database-models/lib/models";
import { error } from "../utils";
import { Errors } from "../utils/errors";


export async function addFilter(quest, user, r, transaction) {
  const filter = [];
  const check = r.payload.filter;
  let create;
  if (check.length < 4) {
    for (let i = 0; i < check.length; i++) {
      if (check[i].filterSkills.length < 6) {
        for (let a = 0; a < check[i].filterSkills.length; a++) {
          create = await Filter.create({
            userId: user,
            questId: quest,
            category: check[i].filterCategory,
            skills: check[i].filterSkills[a]
          }, { transaction });
          if (!create) {
            return error(Errors.NotFound, "Filter does not create", {});
          }
          filter.push(create);
        }
      }
    }
    await transaction.commit()
  }
  if (filter.length === 0) {
    return error(Errors.NotFound, "Filter not found", {});
  }
  return filter;
}
