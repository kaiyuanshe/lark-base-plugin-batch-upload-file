import { bitable, FieldType, IField } from "@lark-base-open/js-sdk";
import { HTTPClient } from "koajax";
import { BaseModel, toggle } from "mobx-restful";

export type SelectionType = Record<
  "baseId" | "fieldId" | "recordId" | "tableId" | "viewId",
  string
>;

export class FileModel extends BaseModel {
  blobClient = new HTTPClient({
    baseURI: "https://ows.blob.core.chinacloudapi.cn/$web/file/",
    responseType: "blob",
  });

  ownClient = new HTTPClient({
    baseURI: "https://service.kaiyuanshe.cn/",
    responseType: "json",
  });

  blobURLOf = (fileName = "") => this.blobClient.baseURI + fileName;

  @toggle("downloading")
  async checkOne(path: string) {
    try {
      await this.blobClient.head(path);
      return true;
    } catch {
      return false;
    }
  }

  @toggle("uploading")
  async uploadOne({ baseId, tableId, recordId }: SelectionType, token = "") {
    const { body } = await this.ownClient.post<{ files: string[] }>(
      `crawler/task/lark/base/${baseId}/${tableId}/${recordId}/file`,
      null,
      { Authorization: `Bearer ${token}` }
    );
    return body;
  }

  protected async fileNameOf(field: IField, recordId: string) {
    const cell = await field.getCell(recordId);
    const [{ name } = {}] = await cell.getValue();

    return name;
  }

  async *findRawList({
    tableId,
    fieldId,
    recordId,
  }: Omit<SelectionType, "baseId">) {
    const table = await bitable.base.getTable(tableId);
    const field = await table.getField(fieldId);

    const getFieldType = await field.getType();
    // 检查是否是文件类型
    if (getFieldType !== FieldType.Attachment)
      throw new TypeError("Not A File");

    if (recordId) {
      yield await this.fileNameOf(field, recordId);
      return;
    }
    for (const { id } of await table.getRecordList())
      yield await this.fileNameOf(field, id);
  }

  async *uploadList(meta: SelectionType) {
    for await (const fileName of this.findRawList(meta)) {
      // 如果没有上传则上传
      if (await this.checkOne(fileName)) continue;

      const { files = [] } = (await this.uploadOne(meta)) || {};

      yield* files;
    }
  }
}

export default new FileModel();
