import {
  Report,
  reportEntities,
  ReportStatus,
  User
} from '@workquest/database-models/lib/models';
import { MediaController } from '../controllers/controller.media';
import { Errors } from "../utils/errors";
import { error, output } from "../utils";

export async function sendReport(r) {
  const user: User = r.auth.credentials;
  const mediaModels = await MediaController.getMedias(r.payload.medias);

  const entityObject = reportEntities[r.payload.entityType];

  if (!entityObject) {
    return error(Errors.NotFound, 'Entity not found', {});
  }

  const entity = await entityObject.entity.findByPk(r.payload.entityId);

  if (!entity) {
    return error(Errors.NotFound, 'Entity not found', {});
  }

  if (
    (entity.userId && entity.userId === user.id) ||
    (entity.id && entity.id === user.id) ||
    (entity.assignedWorkerId && entity.assignedWorkerId === user.id) ||
    (entity.authorId && entity.authorId === user.id)
  ) {
    return error(Errors.InvalidPayload, 'You can`t report yourself or the quest you`re on', {});
  }

  await r.server.app.db.transaction(async (transaction) => {
    const report = await Report.create({
      authorId: user.id,
      title: r.payload.title,
      description: r.payload.description,
      status: ReportStatus.Created,
      entityType: r.payload.entityType,
      entityId: r.payload.entityId,
    }, { transaction });

    await report.$set('medias', mediaModels, { transaction });
  });

  return output();
}
