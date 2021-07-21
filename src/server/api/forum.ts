import { News } from "../models/newsForum";
import { getUUID } from "../utils";
import { string } from "joi";
import { Op } from "sequelize";
import { User } from "../models/User";



export async function creatNewsForum(r) {
  console.log(r.payload.idAuthor);
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
      return "Error creat news";
    }
    return "Ok news creat";
  } catch (e) {
    console.log("ERROR", e);
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
      return "Comment not create";
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
    return "Ok";
  } catch (e) {
    console.log("Error", e);
    return false;
  }
}


export async function likesCreate(r) {
  try {
    const createLike : any = await News.findOne({
      where: {
        id: r.payload.id
      }
    });
    if (!createLike) {
      return "News not found";
    }
    let arr = [...createLike.likes];
    arr.push(r.payload.idUser);
    await createLike.update({
      likes: arr
    });

    return "OK";
  } catch (e) {
    console.log("Error", e);
    return false;
  }

}


export async function deleteNews(r) {
  try {
    const deleteNews = await News.destroy({
      where: {
        id: r.payload.id
      }
    })
    if(!deleteNews){
      return 'Not find news'
    }
    return 'Ok news delete'
  } catch (e){
    console.log('Error', e)
    return false
  }
}


export async function deleteComment(r) {
  try {
    const deleteComment = await News.destroy({
      where: {
        id: r.payload.id
      }
    });
    if(!deleteComment){
      return 'Not found comment'
    }
    const deleteAnswerComment = await News.findOne({
      where: {
        answers: {
          [Op.contains]: [
            r.payload.id
          ]
        }
      }
    })
    deleteAnswerComment.answers = deleteAnswerComment.answers.filter((n) => {
      return n != r.payload.id
    })
    await deleteAnswerComment.update({answers: deleteAnswerComment.answers})
    if (!deleteAnswerComment) {
      return 'Not found comment'
    }
    return 'Ok news delete'
  } catch (e) {
    console.log('Error', e)
    return false
  }
}

export async function findUserInfo(r) {
  try {
    const findUser: any = await User.findAll({
      where: {
        id: r.payload.id
      },
      include:[{model: News, as: 'baseNews', attributes: ['id','text']}]
    });
    if(!findUser){
      return 'Not find user'
    }
    return findUser
  } catch (e){
    console.log('Error', e)
    return false
  }
}
