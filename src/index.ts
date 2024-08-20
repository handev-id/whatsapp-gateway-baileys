import { Boom } from "@hapi/boom";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  MessageUpsertType,
} from "@whiskeySockets/baileys";
import qrcode from "qrcode-terminal";
import { generativeAi } from "./utils/generativeAi";

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log(
        "connection closed due to ",
        lastDisconnect?.error,
        ", reconnecting ",
        shouldReconnect
      );
      // reconnect if not logged out
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("opened connection");
    }
  });

  // Event untuk pesan baru
  sock.ev.on("messages.upsert", async (m) => {
    const message = m.messages[0];

    // Pastikan pesan ini bukan dari diri sendiri
    if (!message.key.fromMe) {
      const remoteJid = message.key.remoteJid;
      const receivedMessage = message.message?.conversation || "";

      const response = await generativeAi(receivedMessage);

      // Kirim balasan otomatis
      await sock.sendMessage(remoteJid!, {
        text: response,
      });

      console.log("Sent auto-reply to", remoteJid);
    }
  });
}

// run in main file
connectToWhatsApp();
