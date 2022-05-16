import { IHandler } from '../types';
import { Media } from '@workquest/database-models/lib/models';

export interface GetMediaByIdCommand {
  readonly mediaId: string;
}

export interface GetMediaByIdsCommand {
  readonly mediaIds: ReadonlyArray<string>;
}

export class GetMediaByIdHandler implements IHandler<GetMediaByIdCommand, Promise<Media>> {
  public Handle(command: GetMediaByIdCommand): Promise<Media> {
    return Media.findByPk(command.mediaId);
  }
}

export class GetMediaByIdsHandler implements IHandler<GetMediaByIdsCommand, Promise<Media[]>>{
  public Handle(command: GetMediaByIdsCommand): Promise<Media[]> {
    return Media.findAll({ where: { userId: command.mediaIds } });
  }
}
