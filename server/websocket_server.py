"""
WebSocket Server for Real-time Transcription Updates
Provides real-time progress updates and transcription results
"""

import asyncio
import json
import logging
import time
from typing import Dict, List, Set, Optional, Any
import websockets
from websockets.server import WebSocketServerProtocol
from dataclasses import dataclass, asdict
import threading
from queue import Queue
import uuid

logger = logging.getLogger(__name__)


@dataclass
class WebSocketMessage:
    type: str
    data: Dict[str, Any]
    timestamp: float = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()
    
    def to_json(self) -> str:
        return json.dumps(asdict(self))


@dataclass
class ClientSubscription:
    client_id: str
    websocket: WebSocketServerProtocol
    subscribed_jobs: Set[int]
    subscribed_metrics: bool = False
    last_ping: float = None
    
    def __post_init__(self):
        if self.last_ping is None:
            self.last_ping = time.time()


class TranscriptionProgressTracker:
    """Track transcription progress and broadcast updates"""
    
    def __init__(self, websocket_server):
        self.websocket_server = websocket_server
        self.job_progress: Dict[int, Dict] = {}
        self.active_transcriptions: Set[int] = set()
    
    def start_job(self, job_id: int, filename: str, duration: float = None):
        """Start tracking a transcription job"""
        self.job_progress[job_id] = {
            "job_id": job_id,
            "filename": filename,
            "status": "starting",
            "progress": 0,
            "stage": "Initializing...",
            "duration": duration,
            "started_at": time.time(),
            "segments": []
        }
        self.active_transcriptions.add(job_id)
        
        # Broadcast job start
        message = WebSocketMessage(
            type="job_started",
            data=self.job_progress[job_id]
        )
        asyncio.create_task(
            self.websocket_server.broadcast_to_job_subscribers(job_id, message)
        )
    
    def update_progress(self, job_id: int, progress: int, stage: str = None, gpu_utilization: float = None):
        """Update job progress"""
        if job_id not in self.job_progress:
            return
        
        self.job_progress[job_id]["progress"] = progress
        self.job_progress[job_id]["status"] = "processing"
        
        if stage:
            self.job_progress[job_id]["stage"] = stage
        
        if gpu_utilization is not None:
            self.job_progress[job_id]["gpu_utilization"] = gpu_utilization
        
        # Broadcast progress update
        message = WebSocketMessage(
            type="progress_update",
            data={
                "job_id": job_id,
                "progress": progress,
                "stage": stage,
                "gpu_utilization": gpu_utilization
            }
        )
        asyncio.create_task(
            self.websocket_server.broadcast_to_job_subscribers(job_id, message)
        )
    
    def add_segment(self, job_id: int, segment: Dict):
        """Add a new transcription segment"""
        if job_id not in self.job_progress:
            return
        
        self.job_progress[job_id]["segments"].append(segment)
        
        # Broadcast new segment
        message = WebSocketMessage(
            type="new_segment",
            data={
                "job_id": job_id,
                "segment": segment
            }
        )
        asyncio.create_task(
            self.websocket_server.broadcast_to_job_subscribers(job_id, message)
        )
    
    def complete_job(self, job_id: int, result: Dict = None):
        """Mark job as completed"""
        if job_id not in self.job_progress:
            return
        
        self.job_progress[job_id]["status"] = "completed"
        self.job_progress[job_id]["progress"] = 100
        self.job_progress[job_id]["completed_at"] = time.time()
        
        if result:
            self.job_progress[job_id]["result"] = result
        
        self.active_transcriptions.discard(job_id)
        
        # Broadcast completion
        message = WebSocketMessage(
            type="job_completed",
            data=self.job_progress[job_id]
        )
        asyncio.create_task(
            self.websocket_server.broadcast_to_job_subscribers(job_id, message)
        )
    
    def fail_job(self, job_id: int, error: str):
        """Mark job as failed"""
        if job_id not in self.job_progress:
            return
        
        self.job_progress[job_id]["status"] = "failed"
        self.job_progress[job_id]["error"] = error
        self.job_progress[job_id]["failed_at"] = time.time()
        
        self.active_transcriptions.discard(job_id)
        
        # Broadcast failure
        message = WebSocketMessage(
            type="job_failed",
            data={
                "job_id": job_id,
                "error": error
            }
        )
        asyncio.create_task(
            self.websocket_server.broadcast_to_job_subscribers(job_id, message)
        )
    
    def get_job_status(self, job_id: int) -> Optional[Dict]:
        """Get current job status"""
        return self.job_progress.get(job_id)


class WebSocketServer:
    """WebSocket server for real-time transcription updates"""
    
    def __init__(self, host: str = "localhost", port: int = 8001):
        self.host = host
        self.port = port
        self.clients: Dict[str, ClientSubscription] = {}
        self.server = None
        self.is_running = False
        self.progress_tracker = TranscriptionProgressTracker(self)
        self.metrics_broadcast_task = None
        
    async def start_server(self):
        """Start the WebSocket server"""
        if self.is_running:
            return
        
        logger.info(f"Starting WebSocket server on {self.host}:{self.port}")
        
        self.server = await websockets.serve(
            self.handle_client,
            self.host,
            self.port,
            ping_interval=30,
            ping_timeout=10
        )
        
        self.is_running = True
        
        # Start metrics broadcasting
        self.metrics_broadcast_task = asyncio.create_task(self.broadcast_metrics_loop())
        
        logger.info(f"WebSocket server started on ws://{self.host}:{self.port}")
    
    async def stop_server(self):
        """Stop the WebSocket server"""
        if not self.is_running:
            return
        
        logger.info("Stopping WebSocket server...")
        
        self.is_running = False
        
        # Cancel metrics broadcasting
        if self.metrics_broadcast_task:
            self.metrics_broadcast_task.cancel()
        
        # Close all client connections
        if self.clients:
            await asyncio.gather(
                *[client.websocket.close() for client in self.clients.values()],
                return_exceptions=True
            )
        
        # Stop the server
        if self.server:
            self.server.close()
            await self.server.wait_closed()
        
        logger.info("WebSocket server stopped")
    
    async def handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """Handle new client connection"""
        client_id = str(uuid.uuid4())
        client = ClientSubscription(
            client_id=client_id,
            websocket=websocket,
            subscribed_jobs=set(),
            subscribed_metrics=False
        )
        
        self.clients[client_id] = client
        logger.info(f"Client {client_id} connected")
        
        try:
            # Send welcome message
            welcome_message = WebSocketMessage(
                type="welcome",
                data={"client_id": client_id}
            )
            await websocket.send(welcome_message.to_json())
            
            # Handle incoming messages
            async for message in websocket:
                try:
                    await self.handle_message(client, message)
                except Exception as e:
                    logger.error(f"Error handling message from {client_id}: {e}")
                    error_message = WebSocketMessage(
                        type="error",
                        data={"message": str(e)}
                    )
                    await websocket.send(error_message.to_json())
        
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client {client_id} disconnected")
        except Exception as e:
            logger.error(f"Error handling client {client_id}: {e}")
        finally:
            # Clean up client
            if client_id in self.clients:
                del self.clients[client_id]
    
    async def handle_message(self, client: ClientSubscription, message: str):
        """Handle incoming message from client"""
        try:
            data = json.loads(message)
            message_type = data.get("type")
            payload = data.get("data", {})
            
            if message_type == "subscribe_job":
                job_id = payload.get("job_id")
                if job_id is not None:
                    client.subscribed_jobs.add(job_id)
                    
                    # Send current job status if available
                    job_status = self.progress_tracker.get_job_status(job_id)
                    if job_status:
                        status_message = WebSocketMessage(
                            type="job_status",
                            data=job_status
                        )
                        await client.websocket.send(status_message.to_json())
            
            elif message_type == "unsubscribe_job":
                job_id = payload.get("job_id")
                if job_id is not None:
                    client.subscribed_jobs.discard(job_id)
            
            elif message_type == "subscribe_metrics":
                client.subscribed_metrics = True
            
            elif message_type == "unsubscribe_metrics":
                client.subscribed_metrics = False
            
            elif message_type == "ping":
                client.last_ping = time.time()
                pong_message = WebSocketMessage(
                    type="pong",
                    data={}
                )
                await client.websocket.send(pong_message.to_json())
            
            else:
                logger.warning(f"Unknown message type: {message_type}")
        
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON message from client {client.client_id}")
        except Exception as e:
            logger.error(f"Error processing message: {e}")
    
    async def broadcast_to_job_subscribers(self, job_id: int, message: WebSocketMessage):
        """Broadcast message to clients subscribed to a specific job"""
        if not self.clients:
            return
        
        subscribers = [
            client for client in self.clients.values()
            if job_id in client.subscribed_jobs
        ]
        
        if subscribers:
            await asyncio.gather(
                *[self._send_safe(client.websocket, message) for client in subscribers],
                return_exceptions=True
            )
    
    async def broadcast_to_metrics_subscribers(self, message: WebSocketMessage):
        """Broadcast message to clients subscribed to metrics"""
        if not self.clients:
            return
        
        subscribers = [
            client for client in self.clients.values()
            if client.subscribed_metrics
        ]
        
        if subscribers:
            await asyncio.gather(
                *[self._send_safe(client.websocket, message) for client in subscribers],
                return_exceptions=True
            )
    
    async def broadcast_to_all(self, message: WebSocketMessage):
        """Broadcast message to all connected clients"""
        if not self.clients:
            return
        
        await asyncio.gather(
            *[self._send_safe(client.websocket, message) for client in self.clients.values()],
            return_exceptions=True
        )
    
    async def _send_safe(self, websocket: WebSocketServerProtocol, message: WebSocketMessage):
        """Safely send message to websocket"""
        try:
            await websocket.send(message.to_json())
        except websockets.exceptions.ConnectionClosed:
            pass  # Client disconnected
        except Exception as e:
            logger.error(f"Error sending message: {e}")
    
    async def broadcast_metrics_loop(self):
        """Periodically broadcast system metrics"""
        try:
            from .gpu_manager import gpu_manager
            
            while self.is_running:
                try:
                    # Get system status
                    status = gpu_manager.get_system_status()
                    
                    # Broadcast to metrics subscribers
                    message = WebSocketMessage(
                        type="system_metrics",
                        data=status
                    )
                    await self.broadcast_to_metrics_subscribers(message)
                    
                    await asyncio.sleep(2.0)  # Broadcast every 2 seconds
                    
                except Exception as e:
                    logger.error(f"Error broadcasting metrics: {e}")
                    await asyncio.sleep(5.0)  # Wait longer on error
        
        except asyncio.CancelledError:
            pass
    
    def get_connected_clients(self) -> int:
        """Get number of connected clients"""
        return len(self.clients)
    
    def get_client_subscriptions(self) -> Dict[str, Dict]:
        """Get client subscription information"""
        return {
            client_id: {
                "subscribed_jobs": list(client.subscribed_jobs),
                "subscribed_metrics": client.subscribed_metrics,
                "last_ping": client.last_ping
            }
            for client_id, client in self.clients.items()
        }


# Global WebSocket server instance
websocket_server = WebSocketServer()


async def start_websocket_server():
    """Start the WebSocket server"""
    await websocket_server.start_server()


async def stop_websocket_server():
    """Stop the WebSocket server"""
    await websocket_server.stop_server()


def run_websocket_server():
    """Run WebSocket server in a separate thread"""
    def server_thread():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            loop.run_until_complete(websocket_server.start_server())
            loop.run_forever()
        except Exception as e:
            logger.error(f"WebSocket server error: {e}")
        finally:
            loop.close()
    
    thread = threading.Thread(target=server_thread, daemon=True)
    thread.start()
    return thread


# Auto-start WebSocket server
try:
    websocket_thread = run_websocket_server()
    logger.info("WebSocket server thread started")
except Exception as e:
    logger.error(f"Failed to start WebSocket server: {e}")


if __name__ == "__main__":
    # Test WebSocket server
    import signal
    import sys
    
    async def test_server():
        await websocket_server.start_server()
        
        # Simulate some transcription progress
        await asyncio.sleep(2)
        
        # Start a test job
        websocket_server.progress_tracker.start_job(1, "test_video.mp4", 120.0)
        
        # Simulate progress updates
        for i in range(0, 101, 10):
            await asyncio.sleep(1)
            websocket_server.progress_tracker.update_progress(
                1, i, f"Processing frame {i}%", gpu_utilization=85.0
            )
            
            # Add some segments
            if i > 20 and i % 20 == 0:
                segment = {
                    "start": i / 10.0,
                    "end": (i + 10) / 10.0,
                    "text": f"Test transcription segment {i//20}",
                    "confidence": 0.95
                }
                websocket_server.progress_tracker.add_segment(1, segment)
        
        # Complete the job
        websocket_server.progress_tracker.complete_job(1, {"total_segments": 5})
        
        # Keep server running
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            pass
        finally:
            await websocket_server.stop_server()
    
    def signal_handler(sig, frame):
        print("\nStopping WebSocket server...")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    print("Starting WebSocket server test...")
    print("Connect to ws://localhost:8001 to test")
    
    try:
        asyncio.run(test_server())
    except KeyboardInterrupt:
        pass
