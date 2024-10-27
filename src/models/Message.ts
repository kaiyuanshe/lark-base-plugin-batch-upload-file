import { HTTPClient } from "koajax";

export class MessageModel {
  client = new HTTPClient({ responseType: "json" });

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
