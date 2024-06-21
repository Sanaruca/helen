import type { ServerWebSocket } from "bun";
import { WSSMessage } from "../WSSMessage";
import { ChatSession } from "@google/generative-ai";

export interface Chat {
  message: string;
}

export async function handleChatMessage<
  T extends ServerWebSocket<{ chat: ChatSession }>
>(ws: T, req: WSSMessage<Chat>): Promise<void> {
  if (!req.data?.message) {
    ws.send(
      WSSMessage.stringify("error", { message: 'param "message" is required' })
    );

    return;
  }

  const { response } = await ws.data.chat.sendMessage(req.data.message);

  ws.send(WSSMessage.stringify<Chat>("chat", { message: response.text() }));
}
