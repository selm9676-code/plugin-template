import { React } from "@vendetta/metro/common";
import { findByProps, findByName } from "@vendetta/metro";
import { before } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { showToast } from "@vendetta/ui/toasts";
import Settings from "./Settings";

const MessageStore     = findByProps("getMessage", "getMessages");
const MessageActions    = findByProps("startEditMessage", "sendMessage");
const { deleteMessage }  = findByProps("deleteMessage", "editMessage");
const UserStore        = findByProps("getCurrentUser");
const ChannelStore     = findByProps("getChannel", "getDMFromUserId");
const PermissionUtils   = findByProps("can", "computePermissions");
const { Permissions }    = findByProps("Permissions");
const MessagesHandlers   = findByName("MessagesHandlers");

storage.mode ??= "edit";
storage.threshold ??= 300;

let unpatch: (() => void) | undefined;
const lastTap: { id?: string; time: number } = { time: 0 };

function resolveMessage(args: any[]) {
  const a = args?.[0] ?? {};
  const channelId = a.channelId ?? a.channel_id ?? a.message?.channel_id;
  const messageId = a.messageId ?? a.message?.id ?? a.id;
  if (!channelId || !messageId) return null;
  const msg = MessageStore.getMessage(channelId, messageId);
  return { channelId, messageId, msg };
}

function canDelete(channelId: string, msg: any, myId: string): boolean {
  if (msg?.author?.id === myId) return true;
  const channel = ChannelStore.getChannel(channelId);
  if (!channel?.guild_id) return false;
  try {
    return PermissionUtils.can({
      permission: Permissions.MANAGE_MESSAGES,
      context: channel,
    });
  } catch {
    return false;
  }
}

export const onLoad = () => {
  unpatch = before("handleTapMessage", MessagesHandlers.prototype, (args) => {
    const now = Date.now();
    const found = resolveMessage(args);
    if (!found) return;
    const { channelId, messageId, msg } = found;

    const isDouble =
      lastTap.id === messageId && now - lastTap.time <= storage.threshold;
    lastTap.id = messageId;
    lastTap.time = now;
    if (!isDouble) return;

    const myId = UserStore.getCurrentUser()?.id;

    if (storage.mode === "edit") {
      if (msg?.author?.id !== myId) {
        return showToast("Can only edit your own messages", 0);
      }
      MessageActions.startEditMessage(channelId, messageId, msg?.content ?? "");
      return;
    }

    if (!canDelete(channelId, msg, myId)) {
      return showToast("No permission to delete this", 0);
    }
    showConfirmationAlert({
      title: "Delete message?",
      content: "This can't be undone.",
      confirmText: "Delete",
      confirmColor: "red",
      onConfirm: () => deleteMessage(channelId, messageId),
    });
  });
};

export const onUnload = () => unpatch?.();
export const settings = Settings;
