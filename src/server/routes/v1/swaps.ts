import Joi = require("joi");
import { getSwapsTake } from "../../api/swaps";
import { outputOkSchema, paginationFields } from "@workquest/database-models/lib/schemes";


export default [
    {
        method: 'GET',
        path: '/v1/swaps/take',
        handler: getSwapsTake,
        options: {
            id: 'v1.swaps.take',
            tags: ['api', 'v1', 'swaps'],
            auth: false,
            validate: {
                query: Joi.object({
                    ...paginationFields,
                    recipient: Joi.string().required().example('some address')
                }),
            },
            response: {
                // schema: outputOkSchema(),
            },
        },
    },
];
