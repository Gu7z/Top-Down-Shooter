import getUrl from "./get_url.js";

export default async function sendScore(score) {
  const baseUrl = getUrl();
  const response = await fetch(`${baseUrl}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(score),
  });

  return response.json();
}
