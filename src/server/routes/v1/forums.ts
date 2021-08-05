import {
  createComment,
  createNews,
  deleteComment,
  deleteNews, findNewsAll,
  deleteLike, like, changeNewsAndComment, createFile, getFiles
} from "../../api/forums";
import {
  createLikeSchemes,
  deleteLikeSchemes,
  createNewsSchemes,
  createCommentSchemes,
  deleteNewsSchemes,
  deleteCommentSchemes,
  changeNewsAndCommentSchemes,
  fileSchemaInfo, filesQuerySchema, schemesNews
} from "../../schemes/news";

export default [
  {
    method: "POST",
    path: "/v1/news/create",
    handler: createNews,
    options: {
      id: "v1.forum.createNews",
      tags: ["api", "forum"],
      description: "Create new news, the file is not empty, but if sent, the field is filled",
      validate: {
        payload: createNewsSchemes
      }
    }
  },
  {
    method: "POST",
    path: "/v1/comment/create",
    handler: createComment,
    options: {
      id: "v1.forum.createComment",
      tags: ["api", "forum"],
      description: "Create new comment",
      validate: {
        payload: createCommentSchemes
      }
    }
  },
  {
    method: "POST",
    path: "/v1/like/create",
    handler: like,
    options: {
      id: "v1.forum.createLike",
      tags: ["api", "forum"],
      description: "Create like",
      validate: {
        payload: createLikeSchemes
      }
    }
  },
  {
    method: "POST",
    path: "/v1/like/delete",
    handler: deleteLike,
    options: {
      id: "v1.forum.deleteLike",
      tags: ["api", "forum"],
      description: "Delete like",
      validate: {
        payload: deleteLikeSchemes
      }
    }
  },
  {
    method: "POST",
    path: "/v1/news/delete",
    handler: deleteNews,
    options: {
      id: "v1.forum.deleteNews",
      tags: ["api", "forum"],
      description: "Delete news",
      validate: {
        payload: deleteNewsSchemes
      }
    }
  },
  {
    method: "POST",
    path: "/v1/comment/delete",
    handler: deleteComment,
    options: {
      id: "v1.forum.comment",
      tags: ["api", "forum"],
      description: "Delete comment",
      validate: {
        payload: deleteCommentSchemes
      }
    }
  },
  {
    method: "GET",
    path: "/v1/news",
    handler: findNewsAll,
    options: {
      id: "v1.forum.findNewsAll",
      tags: ["api", "forum"],
      description: "Find all news, but if you send the author's id, it will find all his news",
      auth: false,
      validate: {
        query: schemesNews
      }
    }
  },
  {
    method: "POST",
    path: "/v1/news/update/",
    handler: changeNewsAndComment,
    options: {
      id: "v1.forum.updateNewsAndComment",
      tags: ["api", "forum"],
      description: "Update news and comment",
      validate: {
        payload: changeNewsAndCommentSchemes
      }
    }
  },
  {
    method: "POST",
    path: "/v1/file/create",
    handler: createFile,
    options: {
      id: "v1.create.file",
      description: `Register new file`,
      tags: ["api", "file"],
      validate: {
        payload: fileSchemaInfo
      }
    }
  },
  {
    method: "GET",
    path: "/v1/allFiles",
    handler: getFiles,
    options: {
      id: "v1.files",
      tags: ["api", "file"],
      description: "Get all files",
      validate: {
        query: filesQuerySchema
      }
    }
  }
];
