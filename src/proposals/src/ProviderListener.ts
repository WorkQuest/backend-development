import { ProposalContract, ProposalEventType } from './ProposalContract';
import { BlockchainNetworks, ProposalCreatedEvents, ProposalParseBlock } from '@workquest/database-models/lib/models';

export enum TrackedEvents {
  ProposalCreated = 'ProposalCreated'
}

abstract class ProviderListener {
  protected readonly _contract: ProposalContract;
  protected readonly _parserBlockInfo: ProposalParseBlock;

  protected constructor(contract: ProposalContract, parserBlockInfo: ProposalParseBlock) {
    this._contract = contract;
    this._parserBlockInfo = parserBlockInfo;
  }

  protected abstract _parseProposalCreatedEvent(data: any): Promise<void>;

  public async parseProposalCreated() {
    for await (const events of this._contract.preParsingEvents()) {
      for (const event of events) await this._onEvent(event);
    }
  }

  protected async _onEvent(event: ProposalEventType): Promise<void> {
    if (event.event === TrackedEvents.ProposalCreated) {
      await this._parseProposalCreatedEvent(event);
    }

    this._parserBlockInfo.lastParsedBlock = event.blockNumber;

    await this._parserBlockInfo.save();
  }

  start(): Promise<void> {
    return this._contract.startListener();
  }
}


export class ProposalEthListener extends ProviderListener {
  constructor(contract: ProposalContract, parserBlockInfo: ProposalParseBlock) {
    super(contract, parserBlockInfo);
  }

  protected async _parseProposalCreatedEvent(event: ProposalEventType): Promise<void> {
    try {
      await ProposalCreatedEvents.findOrCreate({
        where: {
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber
        },
        defaults: {
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          transId: event.transId,
          proposer: event.proposer,
          description: event.description,
          votingPeriod: event.votingPeriod,
          minimumQuorum: event.minimumQuorum,
          network: BlockchainNetworks.ethMainNetwork, // TODO
          event: TrackedEvents.ProposalCreated
        }
      });
    } catch (err) {
      console.log(err);
    }
    return;
  }
}
