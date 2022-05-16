import { HandlerDecoratorBase, IHandler } from "../types";
import { Chat, ChatMember, Media } from "@workquest/database-models/lib/models";
import { error } from "../../utils";
import { Errors } from "../../utils/errors";
import * as aws from 'aws-sdk';
import config from '../../config/config';

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

export class GetMediaPostValidationHandler<Tin extends { mediaId: string }> extends HandlerDecoratorBase<Tin, Promise<Media>> {
  private readonly validator: MediaValidator;

  constructor(
    protected readonly decorated: IHandler<Tin, Promise<Media>>,
  ) {
    super(decorated);

    this.validator = new MediaValidator();
  }

  public async Handle(command: Tin): Promise<Media> {
    const media = await this.decorated.Handle(command);

    await this.validator.MediaMustExists(media);

    return media;
  }
}

export class GetMediasPostValidationHandler<Tin extends { mediaIds: ReadonlyArray<string> }> extends HandlerDecoratorBase<Tin, Promise<Media[]>> {

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
      await this.validator.MediasMustExists(media);
    }

    return medias;
  }
}

export class MediaValidator {
  private spaces = new aws.S3({
    accessKeyId: config.cdn.accessKeyId,
    secretAccessKey: config.cdn.secretAccessKey,
    endpoint: config.cdn.endpoint,
  });

  public async MediaMustExists(media: Media) {
    try {
      //TODO: test with amazon bucket and without cycle
      await this.spaces.getObjectAcl({ Bucket: config.cdn.bucket, Key: media.hash }).promise();
    } catch (err) {
      if (err.code === 'NoSuchKey')       {
        throw error(Errors.InvalidPayload, 'Media is not exists', { mediaId: media.id });
      }
      throw err;
    }
  }

  public async MediasMustExists(media: Media) {
    try {
      //TODO: test with amazon bucket and without cycle
      await this.spaces.getObjectAcl({ Bucket: config.cdn.bucket, Key: media.hash }).promise();
    } catch (err) {
      if (err.code === 'NoSuchKey')       {
        throw error(Errors.InvalidPayload, 'Media is not exists', { mediaId: media.id });
      }
      throw err;
    }
  }
}

