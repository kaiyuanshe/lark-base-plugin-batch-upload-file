import { HTTPClient } from "koajax";

export type SelectionType = Record<
  "baseId" | "fieldId" | "recordId" | "tableId" | "viewId",
  string
>;

export class FileModel {
  blobClient = new HTTPClient({
    baseURI: "https://ows.blob.core.chinacloudapi.cn/$web/file/",
    responseType: "blob",
  });

  ownClient = new HTTPClient({
    baseURI: "https://service.kaiyuanshe.cn/",
    responseType: "json",
  });

  blobURLOf = (fileName = "") => this.blobClient.baseURI + fileName;

  async checkOne(path: string) {
    try {
      await this.blobClient.head(path);
      return true;
    } catch {
      return false;
    }
  }

  async uploadOne({ baseId, tableId, recordId }: SelectionType, token = "") {
    const { body } = await this.ownClient.post<{ files: string[] }>(
      `crawler/task/lark/base/${baseId}/${tableId}/${recordId}/file`,
      null,
      { Authorization: `Bearer ${token}` }
    );
    return body;
  }
}

export default new FileModel();
