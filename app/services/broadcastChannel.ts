let channel: BroadcastChannel | null = null;

function getChannel() {
  if (typeof window === "undefined") return null;

  if (!channel) {
    channel = new BroadcastChannel("app");
  }

  return channel;
}

export function sendEvent(event: any) {
  getChannel()?.postMessage(event);
}