import { HTTPClient } from "koajax";
import { BaseModel, toggle } from "mobx-restful";

export class MessageModel extends BaseModel {
  client = new HTTPClient({ responseType: "json" });

  @toggle("uploading")
  async sendCard(title: string, content: string) {
    const { body } = await this.client.post("", {
      msg_type: "interactive",
      card: {
        header: {
          template: "green",
          title: { tag: "plain_text", content: title },
        },
        elements: [
          {
            tag: "div",
            text: { tag: "lark_md", content },
          },
        ],
      },
    });
    return body;
  }
}

export default new MessageModel();
