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
import { bitable } from "@lark-base-open/js-sdk";
import { useEffect, useRef, useState } from "react";
import { sleep } from "web-utility";

import "./App.css";
import fileStore, { SelectionType } from "./models/File";
import messageStore from "./models/Message";

export function App() {
  const [selectionInfo, setSectionInfo] = useState<SelectionType>();
  const [webHookUrl, setWebHookUrl] = useState<string>(localStorage.webHookUrl);
  const [baseToken, setBaseToken] = useState<string>(localStorage.baseToken);
  const [isBatch, setIsBatch] = useState(false);
  const formApi = useRef<BaseFormApi>();

  useEffect(() => {
    const offSelectionChange = bitable.base.onSelectionChange(({ data }) =>
      setSectionInfo(() => data as SelectionType)
    );
    return offSelectionChange;
  });

  const batchCheckAndUpload = async (meta: SelectionType) => {
    if (!webHookUrl) return;

    messageStore.client.baseURI = webHookUrl;

    for await (const imgURL of fileStore.uploadList(meta)) {
      await messageStore.sendCard(
        "✅失效图片重新上传成功",
        `**存储地址：** [${imgURL}](${imgURL})`
      );
      await sleep(1);
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
          onChange={setWebHookUrl}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <Typography.Title heading={6} style={{ margin: 8 }}>
          Lark Base Token
        </Typography.Title>
        <Input
          placeholder="Authorization"
          size="large"
          onChange={setBaseToken}
        />
      </div>

      <Tabs type="card" style={{ margin: "20px 0" }}>
        <TabPane tab="裁剪图片" itemKey="1" style={{ margin: "20px 0" }}>
          文档
        </TabPane>
        <TabPane tab="批量检查" itemKey="2" style={{ margin: "20px 0" }}>
          <Form
            labelPosition="top"
            onSubmit={() => selectionInfo && batchCheckAndUpload(selectionInfo)}
            getFormApi={(baseFormApi: BaseFormApi) =>
              (formApi.current = baseFormApi)
            }
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <Typography.Title heading={6} style={{ margin: 8 }}>
                {isBatch ? "批量处理" : "单个处理"}
              </Typography.Title>
              <Switch checked={isBatch} onChange={setIsBatch} />
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
