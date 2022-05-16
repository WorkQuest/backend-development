import * as aws from "aws-sdk";
import { error } from "../../utils";
import config from "../../config/config";
import { Errors } from "../../utils/errors";
import { Media } from "@workquest/database-models/lib/models";

export class MediaValidator {
  private spaces = new aws.S3({
    accessKeyId: config.cdn.accessKeyId,
    secretAccessKey: config.cdn.secretAccessKey,
    endpoint: config.cdn.endpoint,
  });

  public async MediaMustExists(media: Media) {
    try {
      await this.spaces.getObjectAcl({ Bucket: config.cdn.bucket, Key: media.hash }).promise();
    } catch (err) {
      if (err.code === 'NoSuchKey')       {
        throw error(Errors.InvalidPayload, 'Media is not exists', { mediaId: media.id });
      }
      throw err;
    }
  }
}

