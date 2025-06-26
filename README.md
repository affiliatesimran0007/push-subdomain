# Push Notification Subdomain

This repository hosts the service worker for push notifications on `push.usproadvisor.com`.

## Purpose

This subdomain solves the cross-origin service worker issue when the main site is hosted on platforms like Duda that don't allow root-level file uploads.

## Files

- `index.html` - Landing page and cross-origin communication handler
- `push-sw.js` - Service worker for handling push notifications
- `CNAME` - GitHub Pages custom domain configuration

## Setup

1. Create subdomain in GoDaddy pointing to GitHub Pages
2. Enable GitHub Pages on this repository
3. Configure HTTPS (automatic with GitHub Pages)

## Integration

The main site communicates with this subdomain via postMessage to register push subscriptions.