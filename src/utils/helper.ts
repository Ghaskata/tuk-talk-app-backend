import fs from "fs";
const createdirectoryIfNotExist = (directoryPath: any) => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
};

export { createdirectoryIfNotExist };
