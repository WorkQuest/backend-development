import { error } from './index';
import { Errors } from './errors';
import { isMediaExists } from './storageService';
import { Transaction } from "sequelize";
import { Media } from "@workquest/database-models/lib/models";

export async function getMedia(mediaId: string, transactions?: Transaction): Promise<Media> {
  const media = await Media.findByPk(mediaId);

  if (!media) {
    if (transactions) await transactions.rollback();

    throw error(Errors.NotFound, 'Media is not found', { mediaId })
  }
  if (!await isMediaExists(media)) {
    if (transactions) await transactions.rollback();

    throw error(Errors.InvalidPayload, 'Media is not exists', { mediaId: media.id });
  }

  return media;
}

export async function getMedias(mediaIds: string[], transactions?: Transaction): Promise<Media[]> {
  const medias = [];

  for (const id of mediaIds) {
    medias.push(await getMedia(id, transactions));
  }

  return medias;
}
