import json
from channels.generic.websocket import AsyncWebsocketConsumer

BROADCAST_GROUP = "aasai_live"


class LiveConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(BROADCAST_GROUP, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(BROADCAST_GROUP, self.channel_name)

    # Receive message from WebSocket client (admin emits mutations)
    async def receive(self, text_data):
        payload = json.loads(text_data)
        # Broadcast to every connected client including sender
        await self.channel_layer.group_send(
            BROADCAST_GROUP,
            {"type": "broadcast", "payload": payload},
        )

    # Handler called by group_send
    async def broadcast(self, event):
        await self.send(text_data=json.dumps(event["payload"]))
