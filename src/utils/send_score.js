import getUrl from "./get_url.js";

const sendScore = async (score) => {
  const url = getUrl();

  await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(score),
  });
};

export default sendScore;
