import { userCategoriesSeed } from "./user-categories";

const run = async () => {
  await userCategoriesSeed();
  console.log("completed");
};

run();
