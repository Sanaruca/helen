import { useEffect, useRef, useState } from "react";
import { WSSMessage } from "../server/WSSMessage";
import Markdown from "react-markdown";
import { Chat as IChat } from "../server/handlers/chat.handler";
import "./Chat.scss";

interface Message {
  rol: "user" | "server";
  message: string;
}

export function Chat() {
  const [isHelenTyping, setIsHelenTyping] = useState(false);
  const [isHelenOnline, setIsHelenOnline] = useState(false);
  const [history, setHistory] = useState<Message[]>([
    // {
    //   rol: "user",
    //   message: "lorem 12",
    // },
    // {
    //   rol: "server",
    //   message: "",
    // },
    // {
    //   rol: "user",
    //   message: "lorem 12",
    // },
  ]);
  const wsClient = useRef<WebSocket | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const chatElement = useRef<HTMLDivElement>(null);
  useEffect(() => {
    console.log("creando connexion con el servidor");

    document.cookie = "X-Token=1234";

    const ws = new WebSocket("http://localhost:3000/helen");

    ws.onopen = function () {
      console.log("conneccion exitosa");
      setIsHelenOnline(true);
    };

    ws.onmessage = function (m) {
      const message = WSSMessage.parse<IChat>(m.data);

      if (message.type === "chat") {
        const messageLength = message.data.message.length;

        setIsHelenTyping(true);

        setTimeout(() => {
          setIsHelenTyping(false);
          setHistory((h) => [
            ...h,
            { rol: "server", message: message.data.message },
          ]);
        }, messageLength * 5);
      } else {
        console.log(message);
      }
    };

    ws.onerror = function (e) {
      console.error("error", e);
      setIsHelenOnline(false);
    };

    ws.onclose = function () {
      setIsHelenOnline(false);
    };

    wsClient.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    chatElement.current?.lastElementChild?.scrollIntoView({
      behavior: "smooth",
    });
  }, [history, isHelenTyping]);

  const onSend = () => {
    if (!input.current || !wsClient.current || !input.current.value) return;

    setHistory([...history, { message: input.current.value, rol: "user" }]);

    wsClient.current.send(
      WSSMessage.stringify<IChat>("chat", { message: input.current.value })
    );

    input.current.value = "";
  };

  return (
    <main className="flex flex-col h-full">
      <header className="flex items-center px-2 pb-1 bg-white shadow-sm pt-3">
        <div className="flex gap-2">
          <img
            src="/pexels-olly-3765151.jpg"
            className="rounded-full w-12 h-12 object-cover"
            alt=""
          />
          <div className="leading-3">
            <h3 className="font-bold text-lg">Helen</h3>

            <span
              className={
                isHelenOnline
                  ? "after:rounded-full after:ml-1 after:h-2 after:w-2 after:bg-green-500 after:inline-block"
                  : ""
              }
            >
              <span
                className={isHelenTyping ? "text-green-500 font-semibold" : ""}
              >
                {isHelenOnline
                  ? isHelenTyping
                    ? "escribiendo..."
                    : "En línea"
                  : "Offline"}
              </span>
            </span>
          </div>
        </div>
      </header>
      <div className="chat" ref={chatElement}>
        {history.length < 1 ? (
          <div className="text-center max-w-72 mx-auto mt-10">
            <img
              src="/pexels-olly-3765151.jpg"
              className="rounded-full w-20 h-20 object-cover m-auto"
              alt=""
            />
            <h1 className="text-2xl font-bold">Helen </h1>
            <p className="text-sm text-gray-600 font-thin">
              Asistente en EducaBotAI
            </p>
            <p className="text-sm text-balance text-slate-800 mt-2">
              Asistente virtual experta en temas de TI, como programación,
              software y hardware.
            </p>
          </div>
        ) : (
          history.map((m, i) => (
            <div className="flex gap-2 items-end" key={i}>
              {m.rol === "server" && (
                <img
                  src="/pexels-olly-3765151.jpg"
                  className="rounded-full w-10 h-10 object-cover sticky bottom-0"
                  alt=""
                />
              )}
              <div key={i} className="chat__message" data-rol={m.rol}>
                <Markdown>{m.message}</Markdown>
              </div>
            </div>
          ))
        )}

        {isHelenTyping && (
          <div className="chat__message" data-rol="server" data-state="typing">
            <span className="chat__message__dot"></span>
            <span className="chat__message__dot"></span>
            <span className="chat__message__dot"></span>
          </div>
        )}
      </div>

      <div className="message_area | bg-white h-16 p-3 flex items-center">
        <div
          className="flex items-center rounded-full bg-slate-300 flex-1 p-1 gap-3 pl-7 cursor-text"
          onClick={() => input.current?.focus()}
        >
          <input
            ref={input}
            maxLength={400}
            placeholder="message..."
            className="  text-black resize-none bg-transparent placeholder:text-gray-700 focus:outline-none flex-1"
            onKeyUp={(e) => {
              if (e.code === "Enter") {
                onSend();
              }
            }}
          />
          <button
            onClick={onSend}
            className="bg-blue-700 text-white flex items-center justify-center rounded-full w-12 h-12 ml-auto"
          >
            <i className="fi fi-sr-paper-plane-top"></i>
          </button>
        </div>
      </div>
    </main>
  );
}
