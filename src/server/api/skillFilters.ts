
import { output } from "../utils";
import {SpecializationFilter} from "@workquest/database-models/lib/models";

export async function getFilters(r) {
  const specialisations = await SpecializationFilter.findAll();
  const map = {}

  for (const specialisation of specialisations) {
    if (!map[specialisation.industryFilter.industry]) {
      map[specialisation.industryFilter.industry] = { key: specialisation.industryKey, specialisations: {} };
    }
    map[specialisation.industryFilter.industry]['specialisations'][specialisation.specialization] = specialisation.key;
  }

  return output(map);
}
