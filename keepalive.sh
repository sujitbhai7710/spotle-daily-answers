#!/bin/bash
cd /home/z/my-project
while true; do
  if ! ss -tlnp | grep -q ":3000 "; then
    echo "$(date) RESTARTING" >> /home/z/my-project/keepalive.log
    npx next dev -p 3000 >> /home/z/my-project/keepalive.log 2>&1 &
    sleep 8
  fi
  sleep 3
done
