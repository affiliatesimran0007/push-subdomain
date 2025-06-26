// Push Notification Service Worker
// Hosted on subdomain for cross-origin push notifications
// Version: 2.0.0

const SW_VERSION = 'v2.0.0';

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received at:', new Date().toISOString());
  
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      try {
        data = JSON.parse(event.data.text());
      } catch (e2) {
        console.error('[Service Worker] Failed to parse push data');
        data = { title: 'Notification', body: 'You have a new notification' };
      }
    }
  }
  
  console.log('[Service Worker] Push data:', data);
  
  const options = {
    body: data.body || data.message || 'You have a new notification',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-192x192.png',
    tag: data.tag || `notification-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || data.data?.url || '/',
      campaignId: data.campaignId || data.data?.campaignId,
      notificationId: data.notificationId || data.data?.notificationId,
      clientId: data.clientId || data.data?.clientId,
      trackingUrl: data.trackingUrl || data.data?.trackingUrl,
      actions: data.actions || []
    }
  };
  
  // Add vibrate only if supported
  if ('vibrate' in navigator) {
    options.vibrate = data.vibrate || [200, 100, 200];
  }
  
  // Add image if provided
  if (data.image) {
    options.image = data.image;
  }
  
  // Add actions if provided
  if (data.actions && Array.isArray(data.actions)) {
    options.actions = data.actions.map(action => ({
      action: action.action,
      title: action.title,
      icon: action.icon
    }));
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();
  
  const data = event.notification.data;
  let urlToOpen = data.url || '/';
  
  // Handle action button clicks
  if (event.action) {
    console.log('[Service Worker] Action clicked:', event.action);
    if (data.actions && Array.isArray(data.actions)) {
      const clickedAction = data.actions.find(a => a.action === event.action);
      if (clickedAction && clickedAction.url) {
        urlToOpen = clickedAction.url;
      }
    }
  }
  
  // Track the click if tracking URL provided
  if (data.trackingUrl && data.clientId) {
    console.log('[Service Worker] Sending click tracking to:', data.trackingUrl);
    fetch(data.trackingUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'notification_clicked',
        campaignId: data.campaignId,
        notificationId: data.notificationId,
        clientId: data.clientId,
        action: event.action || 'click',
        timestamp: new Date().toISOString(),
        metadata: {
          action: event.action || 'default',
          url: urlToOpen
        }
      })
    }).catch(err => console.error('[Service Worker] Failed to track click:', err));
  }
  
  // Open the URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed');
  
  const data = event.notification.data;
  if (data && data.campaignId) {
    fetch('https://push-notification-app-steel.vercel.app/api/campaigns/track-dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: data.campaignId,
        clientId: data.clientId
      })
    }).catch(err => console.error('[Service Worker] Failed to track dismiss:', err));
  }
});

// Update service worker immediately
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing...');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    clients.claim().then(() => {
      console.log('[Service Worker] Active and ready');
    })
  );
});