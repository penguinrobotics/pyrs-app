import { useEffect, useState, useRef } from 'react';

// Singleton WebSocket connection shared across all components
let sharedSocket = null;
let subscribers = [];
let reconnectTimeout = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000; // 1 second

// Shared state
let sharedState = {
  nowServing: [],
  queue: [],
  violations: [],
  isConnected: false,
};

/**
 * Custom React hook for queue data with WebSocket connection
 * Uses a singleton pattern to share one WebSocket connection across all components
 *
 * @returns {{ nowServing: Array, queue: Array, isConnected: boolean }}
 */
export function usePyrsAppData() {
  const [state, setState] = useState(sharedState);
  const subscriberRef = useRef(null);

  useEffect(() => {
    // Create subscriber function for this component
    const updateState = (newState) => {
      setState(newState);
    };

    // Add this component to subscribers
    subscribers.push(updateState);
    subscriberRef.current = updateState;

    // Connect WebSocket if this is the first subscriber
    if (subscribers.length === 1) {
      connectWebSocket();
    } else {
      // Send current state to new subscriber
      updateState(sharedState);
    }

    // Cleanup on unmount
    return () => {
      // Remove this subscriber
      subscribers = subscribers.filter(sub => sub !== subscriberRef.current);

      // Disconnect if no more subscribers
      if (subscribers.length === 0) {
        disconnectWebSocket();
      }
    };
  }, []);

  return state;
}

/**
 * Connect to WebSocket server
 */
function connectWebSocket() {
  // Only run on client side
  if (typeof window === 'undefined') return;

  // Don't create duplicate connections
  if (sharedSocket && sharedSocket.readyState !== WebSocket.CLOSED) {
    console.log('[WebSocket] Connection already exists');
    return;
  }

  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws`;

    console.log('[WebSocket] Connecting to:', url);
    sharedSocket = new WebSocket(url);

    sharedSocket.onopen = () => {
      console.log('[WebSocket] Connected successfully');
      reconnectAttempts = 0; // Reset reconnect counter on successful connection

      // Update connection status
      updateSharedState({ isConnected: true });
    };

    sharedSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WebSocket] Received data:', data);

        // Update shared state with new queue data and violations
        updateSharedState({
          nowServing: data.nowServing || [],
          queue: data.queue || [],
          violations: data.violations || [],
          isConnected: true,
        });
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    };

    sharedSocket.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
    };

    sharedSocket.onclose = (event) => {
      console.log('[WebSocket] Closed:', event.code, event.reason);

      // Update connection status
      updateSharedState({ isConnected: false });

      // Attempt to reconnect if there are still subscribers
      if (subscribers.length > 0) {
        scheduleReconnect();
      }
    };
  } catch (error) {
    console.error('[WebSocket] Connection error:', error);
    scheduleReconnect();
  }
}

/**
 * Disconnect WebSocket
 */
function disconnectWebSocket() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (sharedSocket) {
    console.log('[WebSocket] Disconnecting...');
    sharedSocket.close(1000, 'No more subscribers');
    sharedSocket = null;
  }

  reconnectAttempts = 0;
}

/**
 * Schedule reconnection with exponential backoff
 */
function scheduleReconnect() {
  // Clear any existing reconnect timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  // Don't reconnect if max attempts reached
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('[WebSocket] Max reconnection attempts reached');
    return;
  }

  // Calculate delay with exponential backoff: 1s, 2s, 4s, 8s, etc.
  const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), 30000);
  reconnectAttempts++;

  console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

  reconnectTimeout = setTimeout(() => {
    if (subscribers.length > 0) {
      connectWebSocket();
    }
  }, delay);
}

/**
 * Update shared state and notify all subscribers
 */
function updateSharedState(updates) {
  sharedState = { ...sharedState, ...updates };

  // Notify all subscribers
  subscribers.forEach(subscriber => {
    try {
      subscriber(sharedState);
    } catch (error) {
      console.error('[WebSocket] Error updating subscriber:', error);
    }
  });
}
