import { BaseFormApi } from "@douyinfe/semi-foundation/lib/es/form/interface";
import {
  Button,
  Form,
  Input,
  Switch,
  TabPane,
  Tabs,
  Typography,
} from "@douyinfe/semi-ui";
import { bitable, FieldType, ToastType } from "@lark-base-open/js-sdk";
import { useEffect, useRef, useState } from "react";
import { sleep } from "web-utility";

import "./App.css";
import fileStore, { SelectionType } from "./models/File";

export default function App() {
  const [selectionInfo, setSectionInfo] = useState<SelectionType>();
  const [webHookUrl, setWebHookUrl] = useState<String>(localStorage.webHookUrl);
  const [baseToken, setBaseToken] = useState<String>(localStorage.baseToken);
  const [isBatch, setIsBatch] = useState(false);
  const formApi = useRef<BaseFormApi>();

  useEffect(() => {
    const offSelectionChange = bitable.base.onSelectionChange(({ data }) =>
      setSectionInfo(() => data as SelectionType)
    );
    return offSelectionChange;
  });

  const postBotMsg = async ({ imgURL }: Record<"imgURL", string>) => {
    if (!webHookUrl) return;

    await fetch(webHookUrl as any as URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        msg_type: "interactive",
        card: {
          elements: [
            {
              tag: "div",
              text: {
                content: `**存储地址：** [${imgURL}](${imgURL})`,
                tag: "lark_md",
              },
            },
          ],
          header: {
            template: "green",
            title: {
              content: "✅失效图片重新上传成功",
              tag: "plain_text",
            },
          },
        },
      }),
    });
  };

  const checkAndUpload = async ({
    baseId,
    tableId,
    recordId,
    fieldId,
    viewId,
  }: SelectionType) => {
    const table = await bitable.base.getTable(tableId);
    const field = await table.getField(fieldId);

    const getFieldType = await field.getType();
    // 检查是否是文件类型
    if (getFieldType !== FieldType.Attachment) {
      bitable.ui.showToast({
        toastType: ToastType.error,
        message: "NOt A File",
      });
      return;
    }

    const cell = await field.getCell(recordId);
    const value = await cell.getValue();
    const fileName = value[0]?.name;
    if (!fileName) return;

    // 如果没有上传则上传
    if (await fileStore.checkOne(fileName)) return;

    await fileStore.uploadOne({ baseId, tableId, recordId, fieldId, viewId });

    postBotMsg({ imgURL: fileStore.blobURLOf(fileName) });
  };

  const batchCheckAndUpload = async ({
    baseId,
    tableId,
    fieldId,
    viewId,
  }: SelectionType) => {
    console.log("🚧批量程序，启动！");

    const table = await bitable.base.getTable(tableId);
    const field = await table.getField(fieldId);

    const getFieldType = await field.getType();
    // 检查是否是文件类型
    if (getFieldType !== FieldType.Attachment) {
      bitable.ui.showToast({
        toastType: ToastType.error,
        message: "NOt A File",
      });
      return;
    }

    const recordList = await table.getRecordList();
    console.log("recordList:", recordList);
    let i = 1;
    for (const record of recordList) {
      const cell = await record.getCellByField(fieldId);
      const value = await cell.getValue();
      if (!value?.length) continue;
      const fileName = value?.[0]?.name;
      console.log(record.id, fieldId, "--fileName:", fileName);
      if (!fileName) return;
      // 如果没有上传则上传
      if (!(await fileStore.checkOne(fileName))) {
        await fileStore.uploadOne({
          baseId,
          tableId,
          recordId: record.id,
          fieldId,
          viewId,
        });
        postBotMsg({ imgURL: fileStore.blobURLOf(fileName) });

        await sleep(1);
      }
    }

    console.log("✅跑完了！");
  };

  return (
    <main className="main">
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Typography.Title heading={6} style={{ margin: 8 }}>
          Bot webhook
        </Typography.Title>
        <Input
          placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
          size="large"
          onChange={(value) => setWebHookUrl(value)}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <Typography.Title heading={6} style={{ margin: 8 }}>
          Lark Base Token
        </Typography.Title>
        <Input
          placeholder="Authorization"
          size="large"
          onChange={(value) => setBaseToken(value)}
        />
      </div>

      <Tabs type="card" style={{ margin: "20px 0" }}>
        <TabPane tab="裁剪图片" itemKey="1" style={{ margin: "20px 0" }}>
          文档
        </TabPane>
        <TabPane tab="批量检查" itemKey="2" style={{ margin: "20px 0" }}>
          <Form
            labelPosition="top"
            onSubmit={() =>
              selectionInfo &&
              (isBatch
                ? batchCheckAndUpload(selectionInfo)
                : checkAndUpload(selectionInfo))
            }
            getFormApi={(baseFormApi: BaseFormApi) =>
              (formApi.current = baseFormApi)
            }
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <Typography.Title heading={6} style={{ margin: 8 }}>
                {isBatch ? "批量处理" : "单个处理"}
              </Typography.Title>
              <Switch
                checked={isBatch}
                onChange={(value) => setIsBatch(value)}
              />
            </div>

            {selectionInfo?.fieldId && selectionInfo?.recordId && (
              <Form.Slot label="选中单元格信息">
                <ul>
                  <li>baseId: {selectionInfo.baseId}</li>
                  <li>fieldId: {selectionInfo.fieldId}</li>
                  <li>recordId: {selectionInfo.recordId}</li>
                  <li>tableId: {selectionInfo.tableId}</li>
                  <li>viewId: {selectionInfo.viewId}</li>
                </ul>
              </Form.Slot>
            )}

            <Button
              disabled={
                !selectionInfo?.fieldId ||
                !selectionInfo?.recordId ||
                !baseToken
              }
              theme="solid"
              htmlType="submit"
            >
              {isBatch ? "批量" : "单个"}检测
            </Button>
          </Form>
        </TabPane>
        <TabPane tab="帮助" itemKey="3">
          帮助
        </TabPane>
      </Tabs>
    </main>
  );
}
