import {metaMaskKey, wsProviders} from "../config/constant";

const Web3 = require("web3");

export interface messageHashCreatorInterface {
  readonly recipient: string
  readonly sender: string
  readonly nonce: string
  readonly token: string
  readonly amount: string
  readonly chainFrom: string
  readonly chainTo: string
}

export default async (messageHashCreatorData: messageHashCreatorInterface):Promise<string> => {
  try {
    const signData = []
    signData.push(messageHashCreatorData.nonce)
    signData.push(messageHashCreatorData.amount)
    signData.push(messageHashCreatorData.recipient)
    signData.push(messageHashCreatorData.sender)
    signData.push(messageHashCreatorData.chainFrom)
    signData.push(messageHashCreatorData.chainTo)
    signData.push(messageHashCreatorData.token)
    const web3 = new Web3(wsProviders.bsc);
    let {messageHash} = await web3.eth.accounts.sign(web3.utils.soliditySha3(...signData), metaMaskKey)
    return messageHash
  } catch (e) {
    console.log('Error process Message Hash Creator', e)
  }
}
