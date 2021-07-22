import { News } from '../models/News';
import { getUUID } from '../utils';
import { string } from 'joi';
import { Op, where } from 'sequelize';
import { User } from '../models/User';
import { error, output } from '../utils';
import { Files } from '../models/Files';
import { defaults } from 'pg';
import { Quest, QuestStatus } from '../models/Quest';
import { Errors } from '../utils/errors';
import { QuestsResponse } from '../models/QuestsResponse';
import { fileIdSchema } from '../schemes/files';


export async function creatNewsForum(r) {
  try {
    const createNews = await News.findCreateFind({
      where: {
        id: getUUID()
      },
      defaults: {
        idAuthor: r.payload.idAuthor,
        checkNews: true,
        text: r.payload.text
      }
    });
    if (!createNews) {
      return 'Error creat news';
    }
    return 'Ok news creat';
  } catch (e) {
    return false;
  }
}


export async function creatCommentForum(r) {
  try {
    const [create] = await News.findCreateFind({
      where: {
        id: getUUID()
      },
      defaults: {
        idAuthor: r.payload.idAuthor,
        text: r.payload.text,
        checkNews: false
      }
    });
    if (!create) {
      return 'Comment not create';
    }
    const findNews: any = await News.findOne({
      where: {
        id: r.payload.idNews
      }
    });
    let arr = [...findNews.answers];
    arr.push(create.id);
    await findNews.update({
      answers: arr
    });
    return 'Ok';
  } catch (e) {
    return false;
  }
}


export async function likesCreate(r) {
  try {
    const createLike: any = await News.findOne({
      where: {
        id: r.payload.id
      }
    });
    if (!createLike) {
      return 'News not found';
    }
    let arr = [...createLike.likes];
    arr.push(r.payload.idUser);
    await createLike.update({
      likes: arr
    });

    return 'OK';
  } catch (e) {
    return false;
  }

}


export async function deleteNews(r) {
  try {
    const deleteNews = await News.destroy({
      where: {
        id: r.payload.id
      }
    });
    if (!deleteNews) {
      return 'Not find news';
    }
    return 'Ok news delete';
  } catch (e) {
    return false;
  }
}


export async function deleteComment(r) {
  try {
    const deleteComment = await News.destroy({
      where: {
        id: r.payload.id
      }
    });
    if (!deleteComment) {
      return 'Not found comment';
    }
    const deleteAnswerComment = await News.findOne({
      where: {
        answers: {
          [Op.contains]: [
            r.payload.id
          ]
        }
      }
    });
    deleteAnswerComment.answers = deleteAnswerComment.answers.filter((n) => {
      return n != r.payload.id;
    });
    await deleteAnswerComment.update({ answers: deleteAnswerComment.answers });
    if (!deleteAnswerComment) {
      return 'Not found comment';
    }
    return 'Ok news delete';
  } catch (e) {
    return false;
  }
}

export async function findUserInfo(r) {
  try {
    const findUser: any = await User.findAll({
      where: {
        id: r.payload.id
      },
      include: [{ model: News, as: 'baseNews', attributes: ['id', 'text'] }]
    });
    if (!findUser) {
      return 'Not find user';
    }
    return findUser;
  } catch (e) {
    return false;
  }
}


export const createFile = async (r) => {
  try {
    let userId: any = r.auth.credentials.id;
    const data: any = r.payload.file;

    const compareFile: any = await Files.findOne({
      where: {
        idUser: userId,
        url: data.url
      }
    });
    if (compareFile) {
      return error(404000, 'Early news exists', null);
    }
    const addFile: any = await Files.create({
      idUser: data.idUser,
      contentType: data.contentType,
      url: data.url,
      hash: data.hash
    });
    const id: any = addFile.id;
    return output({ id });
  } catch (err) {
    if (err.message == 'This file type is now allowed') {
      return error(400000, 'This file type is now allowed', null);
    }
    throw err;
  }
};


export async function deleteFile(r) {
  try {
    let userId: any = r.auth.credentials.id;
    const file = await Files.findOne({
      where: {
        id: r.params.idFile,
        idUser: userId
      }
    });

    if (!file) {
      return error(Errors.NotFound, 'File not found', {});
    }
    await file.destroy();
  } catch (err) {
    if (err.message == 'This file type is now allowed') {
      return error(400000, 'This file type is now allowed', null);
    }
    throw err;
  }
  return output();
}

