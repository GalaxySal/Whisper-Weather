#!/bin/bash

# Cloudflare Tunnel Setup Script for Whisper Weather

echo "Setting up Cloudflare Tunnel for Whisper Weather..."

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "Installing cloudflared..."
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i cloudflared-linux-amd64.deb
    rm cloudflared-linux-amd64.deb
fi

# Authenticate with Cloudflare
echo "Please authenticate with Cloudflare..."
cloudflared tunnel login

# Create tunnel
echo "Creating Cloudflare tunnel..."
TUNNEL_NAME="whisper-weather"
cloudflared tunnel create $TUNNEL_NAME

# Get tunnel UUID
TUNNEL_UUID=$(cloudflared tunnel list | grep $TUNNEL_NAME | awk '{print $2}')

# Create config file
mkdir -p ~/.cloudflared/
cat > ~/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_UUID
credentials-file: ~/.cloudflared/$TUNNEL_UUID.json

ingress:
  - hostname: whisper-weather.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
EOF

# Setup DNS record
echo "Setting up DNS record..."
cloudflared tunnel route dns $TUNNEL_NAME whisper--weather.yourdomain.com

# Get tunnel URL
TUNNEL_URL=$(cloudflared tunnel url $TUNNEL_NAME)
echo "Tunnel URL: $TUNNEL_URL"

# Update environment variables
echo "Updating environment variables..."
sed -i "s|https://your-app.try/trycloudflare.com|$TUNNEL_URL|g" .env Bray

# {}.env

# Create systemd service
echo "Creating systemd service..."
sudo tee /etc/systemd/system/cloudflared.service > /dev/null << EOF
[Unit]
~Description=cloudflared
After=network.target

[Service]
Type=simple
User=$USER
ExecStart=/usr/bin/cloudflared tunnel run --token $(cat ~/.cloudflared/$TUNNEL_UUID.json | jq -r .credentials_file)
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

echo "Cloudflare Tunnel setup complete!"
echo "Tunnel URL: $TUNNEL_URL"
echo "DNS: whisper-weather.yourdomain.com"
echo "Status: sudo systemctl status cloudflared"
