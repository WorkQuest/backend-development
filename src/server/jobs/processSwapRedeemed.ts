import {BlockTransactionInterface,} from "./processSwapInitialized";
import processMessageHashCreator from "./processMessageHashCreator";
import { SwapData } from "@workquest/database-models/lib/models";


export interface swapRedeemedReadInterface extends BlockTransactionInterface {
    readonly timestamp: string
    readonly sender: string
    readonly recipient: string
    readonly amount: string
    readonly chainFrom: string
    readonly chainTo: string
    readonly nonce: string
    readonly symbol: string
}

export default async (swapRedeemedData: swapRedeemedReadInterface) => {
    try {
        const messageHash = await processMessageHashCreator(swapRedeemedData)
        const res = await SwapData.update({
                active: false,
            },
            {
                where: {
                    messageHash
                }
            }
        );
        return (res)

    } catch (e) {
        console.log('Error process event SwapRedeemed', e)
    }
}
