import json
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

BROADCAST_GROUP = "aasai_live"


def broadcast(event_type, data):
    """
    Called from synchronous Django views to push a real-time event
    to every connected WebSocket client.
    """
    try:
        layer = get_channel_layer()
        if layer is None:
            return
        async_to_sync(layer.group_send)(
            BROADCAST_GROUP,
            {
                "type":    "broadcast",
                "payload": {"type": event_type, "data": data},
            },
        )
    except Exception:
        pass  # Never crash a view because of a WS failure
