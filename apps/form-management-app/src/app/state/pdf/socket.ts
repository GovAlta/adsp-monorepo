import { io, Socket } from "socket.io-client";
import { AppDispatch } from "../store";
import { pdfActions } from "./pdf.slice";

let socket: Socket | null = null;

export type TokenGetter = () => Promise<string>;

export function disconnectPdfSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
    socket = null;
  }
}

export function connectPdfSocket(pushServiceUrl: string, getToken: TokenGetter, dispatch: AppDispatch) {
  if (socket && socket.connected) return socket;

  socket = io(pushServiceUrl, {
    query: { stream: "pdf-generation-updates" },
    path: "/socket.io",
    withCredentials: true,
    auth: async (cb) => {
      try {
        const token = await getToken();
        cb({ token });
      } catch (err) {
        cb({});
      }
    },
  });

  socket.on("pdf-service:pdf-generation-queued", (data) => {
    dispatch(pdfActions.streamEventReceived(data));   
  });

  socket.on("pdf-service:pdf-generated", (data) => {
    dispatch(pdfActions.pdfProcessing(data));
  });

  socket.on("pdf-service:pdf-generation-failed", (data) => {
    dispatch(pdfActions.streamEventReceived(data));
  });

  socket.on("error", (data) => {
    dispatch(pdfActions.streamEventReceived(data));
  });

  socket.on("connect_error", (err) => {
    console.error("Socket error:", err);
  });

  return socket;
}