#!/bin/sh
host="$1"
shift
echo "Waiting for MySQL at $host..."
until mysql -h "$host" -P 3306 -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1;" >/dev/null 2>&1; do
  echo "Still waiting..."
  sleep 2
done

echo "MySQL is ready, starting backend..."
exec "$@"