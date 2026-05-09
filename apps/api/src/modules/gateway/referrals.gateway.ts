import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN ?? "*", credentials: true },
  namespace: "/",
})
export class ReferralsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ReferralsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: Socket): void {
    try {
      const token =
        (client.handshake.auth as { token?: string }).token ??
        client.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        client.disconnect();
        return;
      }

      this.jwtService.verify(token, {
        secret: this.config.get<string>("jwt.secret"),
      });

      this.logger.debug(`Client connected: ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  /** Broadcast referral status change to all connected clients */
  emitReferralUpdated(referralId: string, newStatus: string): void {
    this.server.emit("referral:updated", { referralId, newStatus });
  }

  /** Broadcast new referral creation */
  emitReferralCreated(referralId: string): void {
    this.server.emit("referral:created", { referralId });
  }
}
