import { ChatSession } from "@google/generative-ai";
import { WSSMessage } from "./WSSMessage";
import { handleChatMessage } from "./handlers/chat.handler";
import { gemini } from "./gemini";

const server = Bun.serve<{ authToken: string; chat?: ChatSession }>({
  async fetch(req, server) {
    console.log("request :>> ", req.url);
    const cookies = parseCookies(req.headers.get("Cookie") ?? "");

    const authToken = cookies["X-Token"];

    if (!authToken) {
      console.error("conneccion rechadad por no esta autenticado");
      return new Response("Need a token", { status: 401 });
    }

    const url = new URL(req.url);

    if (url.pathname === "/helen") {
      console.log(url.pathname);
      const chat = gemini.startChat({
        history: [
          {
            role: "user",
            parts: [
              { text: await Bun.file("./src/server/helen_prompt.txt").text() },
              {
                text: "Ademas de lo anterioror, lo siguiente es informacion que debes conocer para responder en caso de que te pregunten: ",
              },
              { text: await Bun.file("./src/server/ubv/historia.txt").text() },
            ],
          },
          {
            role: "model",
            parts: [
              {
                text: "¡Hola!, me llamo Helen, ¿Como puedo ayudarte hoy 😊?",
              },
            ],
          },
        ],
      });

      server.upgrade(req, {
        data: { authToken, chat },
      });
    } else {
      console.error("404");
      return new Response("Not found", { status: 404 });
    }
  },
  websocket: {
    // handler called when a message is received

    async message(ws, message) {
      if (message instanceof Buffer) {
        ws.send(WSSMessage.stringify("error", { message: "Not allowed" }));
        return;
      }

      const msg = parseWSSMessage<any>(message);

      if (!msg) {
        ws.send(WSSMessage.stringify("error", { message: "invalid message" }));
        return;
      }

      if (msg.type === "chat") {
        // @ts-expect-error
        return handleChatMessage(ws, msg);
      } else {
        ws.send(
          WSSMessage.stringify("error", {
            message: `message of type "${msg.type}" not suported`,
          })
        );
      }
    },

    close() {
      console.log("coneccion cerrada");
    },
  },
});

console.log(`Listening on localhost:${server.port}`);

// function getUserFromToken(token: string): { id: string } {
//   return { id: "asdf" };
// }

function parseCookies(value: string) {
  const cookies: Record<string, string> = {};

  if (!value) return cookies;

  value.split(`;`).forEach(function (cookie) {
    let [name, ...rest] = cookie.split(`=`);
    name = name?.trim();
    if (!name) return;
    const value = rest.join(`=`).trim();
    if (!value) return;
    cookies[name] = decodeURIComponent(value);
  });

  return cookies;
}

function parseWSSMessage<Data = object>(
  message: string
): WSSMessage<Data> | null {
  try {
    return JSON.parse(message);
  } catch (error) {
    return null;
  }
}
