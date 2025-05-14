"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BASE_URL, SOCKET_URL } from "../../../constants";

interface PollData {
  question: string;
  options: string[];
  votes: Record<string, number>;
  id: string;
}

export default function PollBroadcastScreen() {
  const [poll, setPoll] = useState<PollData | null>(null);

  const params = useParams();
  const pollId = params.id as string;

  useEffect(() => {
    fetch(`${BASE_URL}/poll/${pollId}`)
      .then((res) => res.json())
      .then(setPoll);

    const socket = new WebSocket(`${SOCKET_URL}/poll/${pollId}/ws`);
    socket.onmessage = (event) => {
      const updatedTally = JSON.parse(event.data);
      setPoll((prev) => (prev ? { ...prev, votes: updatedTally } : null));
    };

    return () => socket.close();
  }, [pollId]);

  if (!poll)
    return <div className="text-center mt-5 fs-3">Loading poll...</div>;

  const totalVotes = Object.values(poll.votes || {}).reduce((a, b) => a + b, 0);
  console.log(poll, "poll");
  return (
    <div className="container-fluid vh-100 d-flex flex-column justify-content-center align-items-center p-4">
      <h5 className="display-4 text-center mb-5">{poll.question}</h5>

      <div className="w-75">
        {poll?.options?.map((option) => {
          const count = poll?.votes?.[option] || 0;

          return (
            <div key={option} className="mb-4">
              <span className="fs-5">{option}</span> -{" "}
              <span className="fs-6">{count} votes</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
