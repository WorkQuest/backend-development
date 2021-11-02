import * as Joi from "joi";
import {
  limitSchema,
  offsetSchema,
  outputOkSchema,
  filterSchema
} from "@workquest/database-models/lib/schemes";
import { getFilters } from "../../api/skillFilters";

export default [{
  method: "GET",
  path: "/v1/skillFilters",
  handler: getFilters,
  options: {
    id: "v1.skillFilters",
    tags: ["api", "skillFilters"],
    description: "Get all filters",
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label("GetFiltersQuery")
    },
    response: {
      schema: outputOkSchema(filterSchema).label("GetFiltersResponse")
    }
  }
},];

