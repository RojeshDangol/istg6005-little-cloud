FROM node:22-bookworm-slim
WORKDIR /app
COPY flight-tracker/server.mjs flight-tracker/search.mjs flight-tracker/providers.mjs ./flight-tracker/
ENV FLIGHT_TRACKER_GATEWAY=1
CMD ["node", "flight-tracker/server.mjs"]
