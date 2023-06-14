import fs from "fs";

const log = (logFilePath, context) => {
  write(logFilePath, context);
  console.log(context);
};

export const write = (filePath, context) => {
  fs.appendFileSync(filePath, context);
};
export default log;
