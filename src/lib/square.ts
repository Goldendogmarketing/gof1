import { SquareClient, SquareEnvironment } from "square";

export function hasSquareConfig() {
  return Boolean(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID);
}

export function getSquareClient() {
  if (!hasSquareConfig()) return null;

  return new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment:
      process.env.SQUARE_ENVIRONMENT === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox
  });
}

export function getSquareLocationId() {
  return process.env.SQUARE_LOCATION_ID ?? null;
}
