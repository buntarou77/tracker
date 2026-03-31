import { useEffect, useRef, useCallback } from "react";

export type BusEvent<P = any> = {
  type: string;
  payload: P;
};

type Handler = (event: BusEvent) => void;

export function useBroadcastChannel(
  channelName: string,
  onEvent?: Handler
) {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    const handler = (event: MessageEvent<BusEvent>) => {
      onEvent?.(event.data);
    };

    channel.addEventListener("message", handler as EventListener);

    return () => {
      channel.removeEventListener("message", handler as EventListener);
      channel.close();
    };
  }, [channelName, onEvent]);

}