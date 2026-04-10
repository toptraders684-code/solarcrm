export interface IStorageDriver {
  uploadFile(file: Buffer, filePath: string, mimeType: string): Promise<string>;
  downloadFile(fileKey: string): Promise<Buffer>;
  deleteFile(fileKey: string): Promise<void>;
}
