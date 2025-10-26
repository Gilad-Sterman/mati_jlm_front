// SAFE Socket Service - NO automatic connections
// This service will ONLY connect when manually called

import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    console.log('🔌 SocketService created (no auto-connection)');
  }

  /**
   * Manual connection method - ONLY call this explicitly
   */
  connect(token) {
    // Safety check - prevent multiple connections
    if (this.socket && this.socket.connected) {
      console.log('🔌 Socket already connected, skipping...');
      return this.socket;
    }
    
    if (this.socket) {
      console.log('🔌 Cleaning up existing socket...');
      this.disconnect();
    }

    if (!token) {
      console.warn('No token provided, cannot connect to socket');
      return null;
    }

    // Get server URL - use current domain in production, localhost in development
    const serverUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 
                     (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');

    try {
      // Create socket connection
      this.socket = io(serverUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        autoConnect: false // Important: don't auto-connect
      });

      // Setup basic event listeners
      this.setupEventListeners();

      // Manually connect
      this.socket.connect();

      return this.socket;
    } catch (error) {
      console.error('❌ Error creating socket:', error);
      this.socket = null;
      return null;
    }
  }

  /**
   * Manual disconnection
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Setup event listeners for socket
   */
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.isConnected = false;
    });

    this.socket.on('connected', (data) => {
      console.log('Server confirmed connection for:', data.userId);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      hasSocket: !!this.socket,
      isConnected: this.socket ? this.socket.connected : false
    };
  }
}

// Export singleton instance
export default new SocketService();
