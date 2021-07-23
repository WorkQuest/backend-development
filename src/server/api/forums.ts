import { error, output } from "../utils";
import { Files } from "../models/Files";


export const createFile = async (r) => {
  try {
    const file: any = await Files.findOne({
      where: {
        idUser: r.auth.credentials.id,
        url: r.payload.file.url
      }
    });
    if (file) {
      return error(404000, "File not found", null);
    }
    const create: any = await Files.create({
      idUser: r.payload.file.idUser,
      contentType: r.payload.file.contentType,
      url: r.payload.file.url,
      hash: r.payload.file.hash
    });
    const id: any = create.id;
    return output({ id });
  } catch (err) {
    throw error(500000, "Internal Server Error", null);
  }
};


export async function getFiles(r) {
  try {
    const { offset, limit } = r.query;
    const file = await Files.findAndCountAll({
      limit: limit,
      offset: offset,
      where: {
        idUser: r.auth.credentials.id
      },
      attributes: ["id", "contentType", "url", "hash", "createdAt", "updatedAt"]
    });
    if (!file) {
      return error(404000, "Not found", null);
    }
    return output(file);
  } catch (err) {
    throw error(500000, "Internal Server Error", null);
  }
  return output();
}

export async function deleteFile(r) {
  await Files.destroy({
    where: {
      id: r.params.idFile
    }
  });
  return output();
}
