import { ChatMemberValidator } from './ChatMemberValidator';
import { HandlerDecoratorBase, IHandler } from '../../types';
import { ChatMemberAccessPermission } from './ChatMemberAccessPermission';
import { ChatMember, User, Chat } from '@workquest/database-models/lib/models';

export interface GetChatMemberByUserCommand {
  readonly chat: Chat;
  readonly user: User;
}

export interface GetChatMemberByIdCommand {
  readonly chat: Chat;
  readonly id: string;
}

export interface GetChatMembersByUsersCommand {
  readonly chat: Chat;
  readonly users: ReadonlyArray<User>;
}

export interface GetChatMembersByIdsCommand {
  readonly chat: Chat;
  readonly ids: ReadonlyArray<string>;
}

export class GetChatMemberByUserHandler implements IHandler<GetChatMemberByUserCommand, Promise<ChatMember>> {
  public async Handle(command: GetChatMemberByUserCommand): Promise<ChatMember> {
    return await ChatMember.findOne({ where: { userId: command.user.id, chatId: command.chat.id } });
  }
}

export class GetChatMemberByIdHandler implements IHandler<GetChatMemberByIdCommand, Promise<ChatMember>> {
  public async Handle(command: GetChatMemberByIdCommand): Promise<ChatMember> {
    return await ChatMember.findOne({ where: { userId: command.id, chatId: command.chat.id } });
  }
}

export class GetChatMembersByUsersHandler implements IHandler<GetChatMembersByUsersCommand, Promise<ChatMember[]>> {
  public async Handle(command: GetChatMembersByUsersCommand): Promise<ChatMember[]> {
    return await ChatMember.findAll({ where: { userId: command.users.map(user => user.id), chatId: command.chat.id } });
  }
}

export class GetChatMembersByIdsHandler implements IHandler<GetChatMembersByIdsCommand, Promise<ChatMember[]>> {
  public async Handle(command: GetChatMembersByIdsCommand): Promise<ChatMember[]> {
    return await ChatMember.findAll({ where: { userId: command.ids, chatId: command.chat.id } });
  }
}

export class GetChatMemberPostValidationHandler<Tin extends { chat: Chat }> extends HandlerDecoratorBase<Tin, Promise<ChatMember>> {

  private readonly validator: ChatMemberValidator;

  constructor(
    protected readonly decorated: IHandler<Tin, Promise<ChatMember>>,
  ) {
    super(decorated);

    this.validator = new ChatMemberValidator();
  }

  public async Handle(command: Tin): Promise<ChatMember> {
    const chatMember = await this.decorated.Handle(command);

    this.validator.NotNull(command.chat, chatMember);

    return chatMember;
  }
}

export class GetChatMemberPostFullAccessPermissionHandler<Tin extends { chat: Chat }> extends HandlerDecoratorBase<Tin, Promise<ChatMember>> {

  private readonly accessPermission: ChatMemberAccessPermission;

  constructor(
    protected readonly decorated: IHandler<Tin, Promise<ChatMember>>,
  ) {
    super(decorated);
  }

  public async Handle(command: Tin): Promise<ChatMember> {
    const chatMember = await this.decorated.Handle(command);

    this.accessPermission.HasFullAccessOnChat(command.chat, chatMember);

    return chatMember;
  }
}

export class GetChatMemberPostLimitedAccessPermissionHandler<Tin extends { chat: Chat }> extends HandlerDecoratorBase<Tin, Promise<ChatMember>> {

  private readonly accessPermission: ChatMemberAccessPermission;

  constructor(
    protected readonly decorated: IHandler<Tin, Promise<ChatMember>>,
  ) {
    super(decorated);
  }

  public async Handle(command: Tin): Promise<ChatMember> {
    const chatMember = await this.decorated.Handle(command);

    this.accessPermission.HasLimitedAccessOnChat(command.chat, chatMember);

    return chatMember;
  }
}

export class GetChatMembersPostValidationHandler<Tin extends { chat: Chat }> extends HandlerDecoratorBase<Tin, Promise<ChatMember[]>> {

  private readonly validator: ChatMemberValidator;

  constructor(
    protected readonly decorated: IHandler<Tin, Promise<ChatMember[]>>,
  ) {
    super(decorated);

    this.validator = new ChatMemberValidator();
  }

  public async Handle(command: Tin): Promise<ChatMember[]> {
    const chatMember = await this.decorated.Handle(command);

    // this.validator.NotNull(command.chat, chatMember);

    return chatMember;
  }
}

export class GetActiveChatMembersPostAccessPermissionHandler<Tin extends { chat: Chat }> extends HandlerDecoratorBase<Tin, Promise<ChatMember[]>> {

  private readonly accessPermission: ChatMemberAccessPermission;

  constructor(
    protected readonly decorated: IHandler<Tin, Promise<ChatMember[]>>,
  ) {
    super(decorated);
  }

  public async Handle(command: Tin): Promise<ChatMember[]> {
    const chatMember = await this.decorated.Handle(command);

    // this.accessPermission.HasAccessOnChat();

    return chatMember;
  }
}
