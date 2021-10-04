import { SwapTokenEvent } from "@workquest/database-models/lib/models";
import {UInt} from "../listeners/misc";
import processMessageHashCreator from "./processMessageHashCreator";


export interface BlockTransactionInterface {
    readonly blockNumber: number,
    readonly transactionHash: string,
    readonly signature: string,
}


export interface swapInitializedReadInterface extends BlockTransactionInterface {
    readonly timestamp: string
    readonly sender: string
    readonly recipient: string
    readonly amount: string
    readonly chainFrom: string
    readonly chainTo: string
    readonly nonce: string
    readonly symbol: string
}

export default async (swapInitializedData: swapInitializedReadInterface) => {
    try {
        console.log(swapInitializedData, 'swapInitializedData');
        const messageHash = await processMessageHashCreator(swapInitializedData)
        const model: SwapInterface = {
            timestamp: swapInitializedData.timestamp,
            active: true,
            initiator: swapInitializedData.sender.toLowerCase(),
            recipient: swapInitializedData.recipient.toLowerCase(),
            amount: swapInitializedData.amount,
            chainTo: +swapInitializedData.chainTo,
            chainFrom: +swapInitializedData.chainFrom,
            symbol: swapInitializedData.symbol,
            transactionHash: swapInitializedData.transactionHash,
            blockNumber: +swapInitializedData.blockNumber,
            nonce: +swapInitializedData.nonce,
            messageHash: messageHash
        };
        console.log(model, 'model');
        try {
            await SwapTokenEvent.create(model);
        } catch (err) {
            console.log(err);
        }
    } catch (e) {
        console.log('Error process event SwapInitialized', e)
    }
}

interface SwapInterface {
    transactionHash: string;
    messageHash: string
    nonce: UInt,
    active: boolean,
    timestamp: string;
    initiator: string;
    recipient: string;
    amount: string;
    chainTo: UInt;
    chainFrom: UInt;
    symbol: string;
    blockNumber: UInt;
}