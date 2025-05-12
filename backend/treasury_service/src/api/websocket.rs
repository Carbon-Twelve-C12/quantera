use std::collections::HashMap;
use std::sync::{Arc, Mutex, RwLock};
use warp::{ws::Message, Filter};
use futures::{SinkExt, StreamExt};
use tokio::sync::mpsc;
use serde::{Serialize, Deserialize};
use serde_json::json;
use ethereum_client::Address;
use alloy_primitives::FixedBytes;
use crate::clients::{L2BridgeClient, SmartAccountClient, MessageStatus};
use tracing::{info, error, debug};

/// WebSocket client connection
#[derive(Debug)]
struct Client {
    /// The WebSocket sender
    pub sender: mpsc::UnboundedSender<Result<Message, warp::Error>>,
    /// Subscribed topics
    pub topics: Vec<String>,
    /// User address for authentication
    pub user_address: Option<Address>,
}

/// WebSocket event types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum WebSocketEvent {
    /// L2 bridge message status update
    L2MessageStatusUpdate {
        message_id: [u8; 32],
        status: MessageStatus,
        chain_id: u64,
        timestamp: u64,
    },
    /// Smart account operation executed
    SmartAccountOperation {
        account_id: [u8; 32],
        operation_id: [u8; 32],
        operation_type: String,
        timestamp: u64,
        executor: Address,
    },
    /// Smart account delegate added
    SmartAccountDelegateAdded {
        account_id: [u8; 32],
        delegate: Address,
        owner: Address,
    },
    /// Smart account delegate removed
    SmartAccountDelegateRemoved {
        account_id: [u8; 32],
        delegate: Address,
        owner: Address,
    },
}

/// WebSocket subscription request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubscriptionRequest {
    /// The topic to subscribe to
    pub topic: String,
    /// Authentication token (if required)
    pub auth_token: Option<String>,
}

/// WebSocket clients state
pub struct WebSocketState {
    /// Map of client ID to client
    clients: RwLock<HashMap<String, Client>>,
    /// Map of topic to client IDs
    topics: RwLock<HashMap<String, Vec<String>>>,
    /// L2 bridge client for fetching message details
    l2_bridge_client: Arc<L2BridgeClient>,
    /// Smart account client for fetching account details
    smart_account_client: Arc<SmartAccountClient>,
}

impl WebSocketState {
    /// Create a new WebSocket state
    pub fn new(
        l2_bridge_client: Arc<L2BridgeClient>,
        smart_account_client: Arc<SmartAccountClient>,
    ) -> Self {
        Self {
            clients: RwLock::new(HashMap::new()),
            topics: RwLock::new(HashMap::new()),
            l2_bridge_client,
            smart_account_client,
        }
    }

    /// Register a new client
    pub fn register(
        &self,
        client_id: String,
        sender: mpsc::UnboundedSender<Result<Message, warp::Error>>,
    ) {
        let client = Client {
            sender,
            topics: Vec::new(),
            user_address: None,
        };

        // Add client to clients map
        self.clients.write().unwrap().insert(client_id, client);
    }

    /// Unregister a client
    pub fn unregister(&self, client_id: &str) {
        // Remove client from clients map
        if let Some(client) = self.clients.write().unwrap().remove(client_id) {
            // Remove client from all topics
            for topic in client.topics {
                if let Some(clients) = self.topics.write().unwrap().get_mut(&topic) {
                    clients.retain(|id| id != client_id);
                }
            }
        }
    }

    /// Subscribe a client to a topic
    pub fn subscribe(&self, client_id: &str, topic: &str) -> bool {
        let mut clients = self.clients.write().unwrap();
        let mut topics = self.topics.write().unwrap();

        if let Some(client) = clients.get_mut(client_id) {
            // Add topic to client's topics
            if !client.topics.contains(&topic.to_string()) {
                client.topics.push(topic.to_string());
            }

            // Add client to topic's clients
            let topic_clients = topics.entry(topic.to_string()).or_insert_with(Vec::new);
            if !topic_clients.contains(&client_id.to_string()) {
                topic_clients.push(client_id.to_string());
            }

            true
        } else {
            false
        }
    }

    /// Unsubscribe a client from a topic
    pub fn unsubscribe(&self, client_id: &str, topic: &str) -> bool {
        let mut clients = self.clients.write().unwrap();
        let mut topics = self.topics.write().unwrap();

        if let Some(client) = clients.get_mut(client_id) {
            // Remove topic from client's topics
            client.topics.retain(|t| t != topic);

            // Remove client from topic's clients
            if let Some(topic_clients) = topics.get_mut(topic) {
                topic_clients.retain(|id| id != client_id);
            }

            true
        } else {
            false
        }
    }

    /// Set a client's user address for authentication
    pub fn set_client_user_address(&self, client_id: &str, address: Address) -> bool {
        let mut clients = self.clients.write().unwrap();

        if let Some(client) = clients.get_mut(client_id) {
            client.user_address = Some(address);
            true
        } else {
            false
        }
    }

    /// Broadcast an event to all subscribers of a topic
    pub fn broadcast_to_topic(&self, topic: &str, event: &WebSocketEvent) {
        let clients = self.clients.read().unwrap();
        let topics = self.topics.read().unwrap();

        if let Some(client_ids) = topics.get(topic) {
            let message = serde_json::to_string(event).unwrap();
            let message = Message::text(message);

            for client_id in client_ids {
                if let Some(client) = clients.get(client_id) {
                    if let Err(e) = client.sender.send(Ok(message.clone())) {
                        error!("Failed to send message to client {}: {}", client_id, e);
                    }
                }
            }
        }
    }

    /// Broadcast an L2 message status update
    pub async fn broadcast_l2_message_update(
        &self, 
        message_id: [u8; 32], 
        status: MessageStatus
    ) -> Result<(), crate::Error> {
        // Get message details to include chain ID
        let message = self.l2_bridge_client.get_message_details(message_id).await?;
        
        // Create the event
        let event = WebSocketEvent::L2MessageStatusUpdate {
            message_id,
            status,
            chain_id: message.destination_chain_id,
            timestamp: message.timestamp,
        };
        
        // Broadcast to all topics
        self.broadcast_to_topic(&format!("l2_messages"), &event);
        self.broadcast_to_topic(&format!("l2_message:{:?}", message_id), &event);
        self.broadcast_to_topic(&format!("l2_chain:{}", message.destination_chain_id), &event);
        
        // Broadcast to user-specific topic if sender is known
        if message.sender != Address::ZERO {
            self.broadcast_to_topic(&format!("user:{:?}", message.sender), &event);
        }
        
        Ok(())
    }
    
    /// Broadcast a smart account operation
    pub async fn broadcast_smart_account_operation(
        &self,
        account_id: [u8; 32],
        operation_id: [u8; 32],
        operation_type: String,
        executor: Address,
    ) -> Result<(), crate::Error> {
        // Get account details to include owner
        let account = self.smart_account_client.get_account(account_id).await?;
        
        // Create the event
        let event = WebSocketEvent::SmartAccountOperation {
            account_id,
            operation_id,
            operation_type,
            timestamp: chrono::Utc::now().timestamp() as u64,
            executor,
        };
        
        // Broadcast to all topics
        self.broadcast_to_topic(&format!("smart_accounts"), &event);
        self.broadcast_to_topic(&format!("smart_account:{:?}", account_id), &event);
        
        // Broadcast to owner-specific topic
        self.broadcast_to_topic(&format!("user:{:?}", account.owner), &event);
        
        // Broadcast to executor-specific topic if different from owner
        if executor != account.owner {
            self.broadcast_to_topic(&format!("user:{:?}", executor), &event);
        }
        
        Ok(())
    }
    
    /// Broadcast a delegate added event
    pub async fn broadcast_delegate_added(
        &self,
        account_id: [u8; 32],
        delegate: Address,
    ) -> Result<(), crate::Error> {
        // Get account details to include owner
        let account = self.smart_account_client.get_account(account_id).await?;
        
        // Create the event
        let event = WebSocketEvent::SmartAccountDelegateAdded {
            account_id,
            delegate,
            owner: account.owner,
        };
        
        // Broadcast to all topics
        self.broadcast_to_topic(&format!("smart_accounts"), &event);
        self.broadcast_to_topic(&format!("smart_account:{:?}", account_id), &event);
        
        // Broadcast to owner and delegate specific topics
        self.broadcast_to_topic(&format!("user:{:?}", account.owner), &event);
        self.broadcast_to_topic(&format!("user:{:?}", delegate), &event);
        
        Ok(())
    }
    
    /// Broadcast a delegate removed event
    pub async fn broadcast_delegate_removed(
        &self,
        account_id: [u8; 32],
        delegate: Address,
    ) -> Result<(), crate::Error> {
        // Get account details to include owner
        let account = self.smart_account_client.get_account(account_id).await?;
        
        // Create the event
        let event = WebSocketEvent::SmartAccountDelegateRemoved {
            account_id,
            delegate,
            owner: account.owner,
        };
        
        // Broadcast to all topics
        self.broadcast_to_topic(&format!("smart_accounts"), &event);
        self.broadcast_to_topic(&format!("smart_account:{:?}", account_id), &event);
        
        // Broadcast to owner and delegate specific topics
        self.broadcast_to_topic(&format!("user:{:?}", account.owner), &event);
        self.broadcast_to_topic(&format!("user:{:?}", delegate), &event);
        
        Ok(())
    }
}

/// Create WebSocket routes
pub fn websocket_routes(
    state: Arc<WebSocketState>,
) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    // WebSocket endpoint
    let ws_route = warp::path("ws")
        .and(warp::ws())
        .and(with_state(state.clone()))
        .map(|ws: warp::ws::Ws, state: Arc<WebSocketState>| {
            ws.on_upgrade(|socket| handle_websocket_client(socket, state))
        });

    ws_route
}

/// Provide state to handlers
fn with_state(
    state: Arc<WebSocketState>,
) -> impl Filter<Extract = (Arc<WebSocketState>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || state.clone())
}

/// Handle a WebSocket client connection
async fn handle_websocket_client(websocket: warp::ws::WebSocket, state: Arc<WebSocketState>) {
    let (mut client_ws_sender, mut client_ws_rcv) = websocket.split();

    // Generate a client ID
    let client_id = format!("{}", uuid::Uuid::new_v4());

    // Create a channel for this client
    let (client_sender, mut client_rcv) = mpsc::unbounded_channel();

    // Register the client
    state.register(client_id.clone(), client_sender);
    info!("Client connected: {}", client_id);

    // Task to forward messages to the WebSocket client
    tokio::spawn(async move {
        while let Some(result) = client_rcv.recv().await {
            if let Err(e) = client_ws_sender.send(result).await {
                error!("Failed to send message to client: {}", e);
                break;
            }
        }
    });

    // Handle incoming WebSocket messages
    while let Some(result) = client_ws_rcv.next().await {
        let msg = match result {
            Ok(msg) => msg,
            Err(e) => {
                error!("Error receiving WebSocket message: {}", e);
                break;
            }
        };

        // Handle the message
        if msg.is_close() {
            break;
        }

        // Handle text messages
        if let Ok(text) = msg.to_str() {
            debug!("Received message: {}", text);

            // Parse the message as a subscription request
            if let Ok(request) = serde_json::from_str::<SubscriptionRequest>(text) {
                // Subscribe the client to the topic
                if state.subscribe(&client_id, &request.topic) {
                    info!("Client {} subscribed to {}", client_id, request.topic);
                } else {
                    error!("Failed to subscribe client {} to {}", client_id, request.topic);
                }
            } else {
                error!("Invalid subscription request: {}", text);
            }
        }
    }

    // Client disconnected, unregister it
    state.unregister(&client_id);
    info!("Client disconnected: {}", client_id);
}

/// Start WebSocket server
pub fn start_websocket_server(
    l2_bridge_client: Arc<L2BridgeClient>,
    smart_account_client: Arc<SmartAccountClient>,
) -> Arc<WebSocketState> {
    // Create WebSocket state
    let state = Arc::new(WebSocketState::new(
        l2_bridge_client,
        smart_account_client,
    ));

    // Start WebSocket server
    let routes = websocket_routes(state.clone());
    tokio::spawn(async move {
        warp::serve(routes).run(([127, 0, 0, 1], 3031)).await;
    });

    state
} 