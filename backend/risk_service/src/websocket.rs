// WebSocket implementation for real-time risk monitoring
use std::sync::Arc;
use std::net::SocketAddr;
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use futures_util::{SinkExt, StreamExt};
use uuid::Uuid;
use serde_json;
use tracing::{info, error, warn};
use crate::{RiskService, RiskMetrics};

pub struct WebSocketServer {
    risk_service: Arc<RiskService>,
    port: u16,
}

impl WebSocketServer {
    pub fn new(risk_service: Arc<RiskService>, port: u16) -> Self {
        Self {
            risk_service,
            port,
        }
    }
    
    pub async fn start(&self) -> Result<(), Box<dyn std::error::Error>> {
        let addr = SocketAddr::from(([0, 0, 0, 0], self.port));
        let listener = TcpListener::bind(&addr).await?;
        info!("WebSocket server listening on ws://{}", addr);
        
        while let Ok((stream, peer)) = listener.accept().await {
            info!("WebSocket connection from: {}", peer);
            let service = self.risk_service.clone();
            
            tokio::spawn(async move {
                if let Err(e) = handle_connection(stream, peer, service).await {
                    error!("WebSocket connection error: {}", e);
                }
            });
        }
        
        Ok(())
    }
}

async fn handle_connection(
    stream: TcpStream,
    peer: SocketAddr,
    risk_service: Arc<RiskService>,
) -> Result<(), Box<dyn std::error::Error>> {
    let ws_stream = accept_async(stream).await?;
    info!("WebSocket connection established: {}", peer);
    
    let (ws_sender, mut ws_receiver) = ws_stream.split();
    let client_id = Uuid::new_v4();
    
    // Create channel for sending updates to this client
    let (tx, mut rx) = tokio::sync::mpsc::channel::<RiskMetrics>(100);
    let (cmd_tx, mut cmd_rx) = tokio::sync::mpsc::channel::<Message>(100);
    
    // Register the client
    risk_service.register_websocket_client(client_id, tx).await;
    
    // Spawn task to forward risk updates to WebSocket
    let mut ws_sender = ws_sender;
    let send_task = tokio::spawn(async move {
        loop {
            tokio::select! {
                Some(metrics) = rx.recv() => {
                    if let Ok(json) = serde_json::to_string(&metrics) {
                        if ws_sender.send(Message::Text(json)).await.is_err() {
                            break;
                        }
                    }
                }
                Some(msg) = cmd_rx.recv() => {
                    if ws_sender.send(msg).await.is_err() {
                        break;
                    }
                }
            }
        }
    });
    
    // Handle incoming messages
    while let Some(msg) = ws_receiver.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                // Parse and handle commands
                if let Ok(command) = serde_json::from_str::<WebSocketCommand>(&text) {
                    match command {
                        WebSocketCommand::Subscribe { portfolio_address } => {
                            info!("Client {} subscribed to portfolio {}", client_id, portfolio_address);
                            // Immediately send current metrics
                            if let Ok(metrics) = risk_service.calculate_portfolio_risk(
                                portfolio_address.parse().unwrap_or_default()
                            ).await {
                                let tx = risk_service.get_client_sender(client_id).await;
                                if let Some(tx) = tx {
                                    let _ = tx.send(metrics).await;
                                }
                            }
                        }
                        WebSocketCommand::Unsubscribe { portfolio_address } => {
                            info!("Client {} unsubscribed from portfolio {}", client_id, portfolio_address);
                        }
                        WebSocketCommand::Ping => {
                            // Send pong through command channel
                            if let Ok(json) = serde_json::to_string(&WebSocketResponse::Pong) {
                                let _ = cmd_tx.send(Message::Text(json)).await;
                            }
                        }
                    }
                }
            }
            Ok(Message::Ping(data)) => {
                // Respond with pong through command channel
                let _ = cmd_tx.send(Message::Pong(data)).await;
            }
            Ok(Message::Close(_)) => {
                info!("Client {} disconnected", client_id);
                break;
            }
            Err(e) => {
                error!("WebSocket error: {}", e);
                break;
            }
            _ => {}
        }
    }
    
    // Cleanup
    risk_service.unregister_websocket_client(client_id).await;
    send_task.abort();
    
    Ok(())
}

#[derive(Debug, serde::Deserialize)]
#[serde(tag = "type")]
pub enum WebSocketCommand {
    Subscribe { portfolio_address: String },
    Unsubscribe { portfolio_address: String },
    Ping,
}

#[derive(Debug, serde::Serialize)]
#[serde(tag = "type")]
pub enum WebSocketResponse {
    Metrics(RiskMetrics),
    Pong,
    Error { message: String },
}
