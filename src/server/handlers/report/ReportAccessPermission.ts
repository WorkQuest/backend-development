import { EntityReport } from "./GetEntityForReportHandler";
import { DiscussionComment, ReportEntityType, Quest, User } from '@workquest/database-models/lib/models';
import { error } from '../../utils';
import { Errors } from '../../utils/errors';

export class ReportAccessPermission {
  public NotSendReportYourself(author: User, entity: EntityReport, type: ReportEntityType) {
    const checkUser = function(user: User) {
      if (user.id === author.id) {
        throw error(Errors.InvalidPayload, 'You can`t report yourself', {});
      }
    }
    const checkQuest = function(quest: Quest) {
      if (
        quest.userId === author.id ||
        quest.assignedWorkerId === author.id
      ) {
        throw  error(Errors.InvalidPayload, 'You cannot report a quest you are doing/created', {});
      }
    }
    const checkDiscussionComment = function(comment: DiscussionComment) {
      if (comment.authorId === author.id) {
        throw  error(Errors.InvalidPayload, 'You cannot report a comment that was created', {});
      }
    }

    if (type === ReportEntityType.User) {
      checkUser(entity as unknown as User);
    } else if (type === ReportEntityType.Quest) {
      checkQuest(entity as unknown as Quest);
    } else if (type === ReportEntityType.DiscussionComment) {
      checkDiscussionComment(entity as unknown as DiscussionComment)
    }
  }
}
