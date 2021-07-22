import { News } from "../models/News";
import { error, getUUID, output } from "../utils";
import { Op, where } from "sequelize";
import { User } from "../models/User";
import { Files } from "../models/Files";
import { Errors } from "../utils/errors";


export async function createNews(r) {
  try {
    const createNews = await News.findCreateFind({
      where: {
        id: getUUID()
      },
      defaults: {
        idAuthor: r.auth.credentials.id,
        isNews: true,
        text: r.auth.credentials.text
      }
    });
    if (!createNews) {
      return error(400000,'News not create',{});
    }
    return output({status: 'Success'})
  } catch (e) {
    console.log("ERROR", e);
    return false;
  }
}


export async function createComment(r) {
  try {
    const [create] = await News.findCreateFind({
      where: {
        id: getUUID()
      },
      defaults: {
        idAuthor: r.auth.credentials.id,
        text: r.auth.credentials.text,
        isNews: false
      }
    });
    if (!create) {
      return error(400000,'News not create',{});
    }
    const findNews: any = await News.findOne({
      where: {
        id: r.auth.credentials.idNews
      }
    });
    let arr = [...findNews.answers];
    arr.push(create.id);
    await findNews.update({
      answers: arr
    });
    return output({status: 'Success'})
  } catch (e) {
    console.log("ERROR", e);
    return false;
  }
}


export async function createLikes(r) {
  try {
    const createLike: any = await News.findOne({
      where: {
        id: r.auth.credentials.idNews
      }
    });
    if (!createLike) {
      return error(404000,'Not found news',{});
    }
    let arr = [...createLike.likes];
    arr.push(r.auth.credentials.id);
    await createLike.update({
      likes: arr
    });
    return output({status: 'Success'})
  } catch (e) {
    console.log("ERROR", e);
    return false;
  }
}


export async function deleteLike(r) {
  try {
    const deleteLike = await News.findOne({
      where: {
        id: r.auth.credentials.id,
        likes: {
          [Op.contains]: [
            r.auth.credentials.idUser
          ]
        }
      }
    });
    deleteLike.likes = deleteLike.likes.filter((n) => {
      return n != r.auth.credentialsidUser;
    });
    await deleteLike.update({ likes: deleteLike.likes });
    if (!deleteLike) {
      return error(404000,'Not found news',{});
    }
    return output({status: 'Success'})
  } catch (e) {
    console.log("ERROR", e);
    return false;
  }
}


export async function deleteNews(r) {
  try {
    const checkOwner = await News.findOne({
      where: {
        id: r.payload.id
      }
    });
    if (String(checkOwner.idAuthor) === String(r.auth.credentials.id)) {
      const deleteNews = await News.destroy({
        where: {
          id: r.auth.credentials.id
        }
      });
      if (!deleteNews) {
        return error(404000,'Not found news',{});
      }
      return output({status: 'Success'})
    }
    return error(403000,'You not owner',{});
  } catch (e) {
    console.log("ERROR", e);
    return false;
  }
}


export async function deleteComment(r) {
  try {
    const checkOwner = await News.findOne({
      where: {
        id: r.payload.idNews
      }
    });
    if (!checkOwner) {
      return error(404000,'Not found news',{});
    }
    if (String(checkOwner.idAuthor) === String(r.auth.credentials.id)) {
      const deleteComment = await News.destroy({
        where: {
          id: r.payload.idComment
        }
      });
      if (!deleteComment) {
        return error(404000,'Not found comment',{});
      }
      const deleteAnswerComment = await News.findOne({
        where: {
          answers: {
            [Op.contains]: [
              r.payload.idComment
            ]
          }
        }
      });
      deleteAnswerComment.answers = deleteAnswerComment.answers.filter((n) => {
        return n != r.payload.idComment;
      });
      await deleteAnswerComment.update({ answers: deleteAnswerComment.answers });
      if (!deleteAnswerComment) {
        return error(404000,'Not found comment',{});
      }
      return output({status: 'Success'})
    }
    return error(403000,'You not owner',{});
  } catch (e) {
    console.log("ERROR", e);
    return false;
  }
}

export async function userInformation(r) {
  try {
    const findUser: any = await User.findAll({
      where: {
        id: r.auth.credentials.id
      },
      include: [{ model: News, as: "baseNews", attributes: ["id", "text"] }]
    });
    if (!findUser) {
      return error(404000,'Not found user',{});
    }
    return findUser;
  } catch (e) {
    console.log("ERROR", e);
    return false;
  }
}


export async function findNewsComments(r) {
  try {
    const findNews = await News.findOne({
      where: {
        id: r.auth.credentials.id
      }
    });
    if (!findNews) {
      return error(404000,'Not found news',{});
    }
    const findComment = await News.findAll({
      where: {
        id: { [Op.in]: findNews.answers }
      }
    });
    if (!findComment) {
      return error(404000,'Not found comment',{});
    }
    return findComment;
  } catch (e) {
    console.log("ERROR", e);
    return false;
  }
}


export async function findNewsAll(r) {
  try {
    const findNewsAll = await News.findAll({});
    if (!findNewsAll) {
      return error(404000,'Not found news',{});
    }
    return findNewsAll;
  } catch (e) {
    console.log("ERROR", e);
    return false;
  }
}


export const createFile = async (r) => {
  try {
    const data: any = r.payload.file;
    const findFile: any = await News.findOne({
      where: {
        id: data.idNews
      }
    });
    if (!findFile) {
      return error(404000, 'News not found', null);
    }
    if (findFile) {
      const compareFile: any = await Files.findAll({
        where: {
          idNews: data.idNews
        }
      });
      if (compareFile) {
        for (let i = 0; i < compareFile.length; i++) {
          if (compareFile[i].url === data.url) {
            return error(404000, 'Early news exists', null);
          }
        }
      }
    }
    const addFile: any = await Files.create({
      idNews: data.idNews,
      contentType: data.contentType,
      url: data.url,
      hash: data.hash
    });
    if (!addFile) {
      return error(404000, 'File not found', null);
    }
    return output({ addFile });
  } catch (err) {
    if (err.message == 'This file type is now allowed') {
      return error(400000, 'This file type is now allowed', null);
    }
    throw err;
  }
};


export async function deleteFile(r) {
  try {
    const file = await Files.findByPk(r.params.idFile);
    console.log(r.params.idFile);

    if (!file) {
      return error(Errors.NotFound, 'Quest not found', {});
    }
    await Files.destroy({ where: { id: r.params.idFile } });
  } catch (err) {
    if (err.message == 'This file type is now allowed') {
      return error(400000, 'This file type is now allowed', null);
    }
    throw err;
  }
  return output()
}



