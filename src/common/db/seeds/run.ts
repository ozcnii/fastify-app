import { userCategoriesSeed } from "./user-categories.seed";

const run = async () => {
  await userCategoriesSeed();
  console.log("completed");
};

run();
