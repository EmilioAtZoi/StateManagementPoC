import { NextApiRequest, NextApiResponse } from "next";

let cloudState = { isOnline: false, lastUpdated: Date.now() };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    res.status(200).json(cloudState);
  } else if (req.method === "POST") {
    const { isOnline, lastUpdated } = req.body;
    cloudState = { isOnline, lastUpdated };
    res.status(200).json({ message: "State updated" });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
