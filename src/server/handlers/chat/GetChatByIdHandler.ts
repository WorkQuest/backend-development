import { HandlerDecoratorBase, IHandler } from "../types";
import { Chat, Media } from "@workquest/database-models/lib/models";
import { MediaValidator } from "../media/MediaValidator"

export interface GetChatByIdCommand {
  readonly chatId: string;
}

export class GetChatByIdHandler implements IHandler<GetChatByIdCommand, Promise<Chat>> {
  public Handle(command: GetChatByIdCommand): Promise<Chat> {
    return Chat.findByPk(command.chatId);
  }
}

export class GetChatByIdPostValidationHandler<Tin extends { medias: Media[] }> extends HandlerDecoratorBase<Tin, Promise<Media[]>> {
  private readonly validator: MediaValidator;

  constructor(
    protected readonly decorated: IHandler<Tin, Promise<Media[]>>,
  ) {
    super(decorated);

    this.validator = new MediaValidator();
  }

  public async Handle(command: Tin): Promise<Media[]> {
    const medias = await this.decorated.Handle(command);

    for (const media of medias) {
      await this.validator.MediaMustExists(media);
    }

    return medias;
  }
}
