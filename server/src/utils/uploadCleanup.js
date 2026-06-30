import fs from "fs/promises";
import path from "path";

const uploadTempDir = path.resolve("public", "temp");

const collectUploadedFiles = (files) => {
  if (!files) return [];
  if (Array.isArray(files)) return files;
  return Object.values(files).flat();
};

const isTempUploadPath = (filePath) => {
  if (!filePath) return false;

  const resolvedPath = path.resolve(filePath);
  return (
    resolvedPath === uploadTempDir || resolvedPath.startsWith(uploadTempDir + path.sep)
  );
};

export const cleanupUploadedFiles = async (req) => {
  const uploadedFiles = [...collectUploadedFiles(req.files), req.file].filter(
    Boolean,
  );

  await Promise.all(
    uploadedFiles.map(async (file) => {
      if (!isTempUploadPath(file.path)) return;
      await fs.rm(file.path, { force: true });
    }),
  );
};
