import { io, Socket } from "socket.io-client";
import { queryClient } from "../api/queryClient";
import { referralKeys } from "../api/hooks/useReferrals";

interface ReferralUpdatedEvent {
  referralId: string;
  newStatus: string;
}

let socket: Socket | null = null;

export function connectWebSocket(): () => void {
  const wsUrl = import.meta.env.VITE_WS_URL ?? "http://localhost:3000";
  const token = localStorage.getItem("access_token");

  socket = io(wsUrl, {
    auth: { token },
    transports: ["websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    console.info("[WS] Connected");
  });

  socket.on("disconnect", (reason) => {
    console.info("[WS] Disconnected:", reason);
  });

  socket.on("referral:updated", (event: ReferralUpdatedEvent) => {
    console.log("Socket event: referral updated...");
    
    void queryClient.invalidateQueries({
      queryKey: referralKeys.detail(event.referralId),
    });
    void queryClient.invalidateQueries({
      queryKey: referralKeys.lists(),
    });
  });

  socket.on("referral:created", () => {
    void queryClient.invalidateQueries({ queryKey: referralKeys.lists() });
  });

  return () => {
    socket?.disconnect();
    socket = null;
  };
}

export function getSocket(): Socket | null {
  return socket;
}
