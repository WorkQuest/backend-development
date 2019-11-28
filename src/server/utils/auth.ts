export default async (request, username, password, h) => {
  let isValid = true;
  let credentials = {};

  return { isValid, credentials };
};
