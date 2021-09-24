import { SwapData } from "@workquest/database-models/lib/models";
import {BlockTransactionInterface,} from "../listeners/interfaces";
import {UInt} from "../listeners/misc";
import processMessageHashCreator from "./processMessageHashCreator";

export interface swapInitializedReadInterface extends BlockTransactionInterface {
    readonly timestamp: string
    readonly sender: string
    readonly recipient: string
    readonly amount: string
    readonly chainFrom: string
    readonly chainTo: string
    readonly nonce: string
    readonly token: string
}

export default async (swapInitializedData: swapInitializedReadInterface) => {
    try {
        const messageHash = await processMessageHashCreator(swapInitializedData)
        const model: SwapInterface = {
            timestamp: swapInitializedData.timestamp,
            active: true,
            initiator: swapInitializedData.sender.toLowerCase(),
            recipient: swapInitializedData.recipient.toLowerCase(),
            amount: +swapInitializedData.amount,
            chainTo: +swapInitializedData.chainTo,
            chainFrom: +swapInitializedData.chainFrom,
            token: swapInitializedData.token,
            transactionHash: swapInitializedData.transactionHash,
            blockNumber: +swapInitializedData.blockNumber,
            nonce: +swapInitializedData.nonce,
            messageHash: messageHash
        };
        try {
            await SwapData.create(model);
        } catch (err) {
            console.log(err);
        }
    } catch (e) {
        console.log('Error process event SwapInitialized', e)
    }
}

interface SwapInterface {
    transactionHash: string;
    active: boolean,
    timestamp: string;
    initiator: string;
    recipient: string;
    amount: UInt;
    chainTo: UInt;
    chainFrom: UInt;
    token: string;
    blockNumber: UInt;
    nonce: UInt,
    messageHash: string
}
