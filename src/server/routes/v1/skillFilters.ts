import * as Joi from "joi";
import * as handlers from "../../api/skillFilters";
import {
  limitSchema,
  offsetSchema,
  outputOkSchema,
  // filterSchema
} from "@workquest/database-models/lib/schemes";

export default [{
  method: "GET",
  path: "/v1/skillFilters",
  handler: handlers.getFilters,
  options: {
    id: "v1.getSkillFilters",
    tags: ["api", "skill-filters"],
    description: "Get all filters",
    auth: false,
    // response: {
    //   schema: outputOkSchema(filterSchema).label("GetFiltersResponse")
    // }
  }
}];
