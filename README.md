# Mgrok, the poor's man ngrok-like replacement (sort-of)

Ok so, I like openning reverse tunnels, I really like what `ngrok` does, specially with HTTPS. 

A Record, hostname *.mgrok, server your server
TXT Record, hostname _acme-challenge.mgrok

```
sudo certbot certonly \
  --agree-tos \
  --email pedro@palhari.dev \
  --manual \
  --preferred-challenges=dns \
  -d *.mgrok.palhari.dev \
  --server https://acme-v02.api.letsencrypt.org/directory

/etc/letsencrypt/live/mgrok.palhari.dev/privkey.pem
/etc/letsencrypt/live/mgrok.palhari.dev/fullchain.pem

server {
  server_name *.mgrok.palhari.dev;

  location / {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    
    proxy_pass http://localhost:9009;
  }

  listen 443 ssl; 
  ssl_certificate /etc/letsencrypt/live/mgrok.palhari.dev/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/mgrok.palhari.dev/privkey.pem;

  include /etc/letsencrypt/options-ssl-nginx.conf; 
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; 
}

server {
  if ($host = *.mgrok.palhari.dev) {
      return 301 https://$host$request_uri;
  } # managed by Certbot

  listen 80;

  server_name *.mgrok.palhari.dev;
  return 404; # managed by Certbot
}
```