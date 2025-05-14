"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BASE_URL, SOCKET_URL } from "../../../constants";

interface PollData {
  question: string;
  options: string[];
  expiresAt: string;
}

export default function PollVoteScreen() {
  const [poll, setPoll] = useState<PollData | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "voted" | "error">("idle");

  const params = useParams();
  const pollId = params.id as string;

  // A fake user ID for now (should be replaced with real auth)
  const [userId] = useState(
    () => "user-" + Math.random().toString(36).substring(2, 10)
  );

  useEffect(() => {
    fetch(`${BASE_URL}/poll/${pollId}`)
      .then((res) => res.json())
      .then(setPoll);
  }, [pollId]);

  const getAnonToken = async () => {
    const res = await fetch(`${BASE_URL}/auth/anon`, {
      method: "POST",
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("jwtToken", data.token);
      return data.token;
    } else {
      throw new Error("Failed to retrieve token");
    }
  };

  const submitVote = async () => {
    try {
      if (!selected) return;

      const token = await getAnonToken();

      console.log(token, "token-25");
      const res = await fetch(`${BASE_URL}/poll/${pollId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vote: selected, userId }),
      });

      if (res.ok) {
        setStatus("voted");
        const timeoutId = setTimeout(() => {
          setStatus("idle");
        }, 200);

        return () => clearTimeout(timeoutId);
      } else {
        setStatus("error");
      }
    } catch (e) {
      console.error("Error submitting vote:", e);
      setStatus("error");
    }
  };

  if (!poll) return <div className="text-center mt-5">Loading poll...</div>;

  return (
    <div
      className="container d-flex flex-column p-4 justify-content-center"
      style={{ height: "100svh" }}
    >
      <h2 className="mb-4">{poll.question}</h2>

      <div style={{ textAlign: "left" }}>
        {poll?.options?.map((option) => (
          <div className="form-check mb-2" key={option}>
            <input
              className="form-check-input"
              type="radio"
              name="voteOption"
              value={option}
              id={option}
              checked={selected === option}
              onChange={() => setSelected(option)}
            />
            <label className="form-check-label" htmlFor={option}>
              {option}
            </label>
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary mt-3 btn-sm"
        style={{
          padding: "0.5rem 1rem",
          textAlign: "left",
          width: "fit-content",
        }}
        onClick={submitVote}
        disabled={
          !selected ||
          status === "voted" ||
          new Date(poll.expiresAt) < new Date()
        }
      >
        Submit Vote
      </button>

      {new Date(poll.expiresAt) < new Date() && (
        <p className="text-warning mt-3">
          ⚠️ This poll has closed. Voting is no longer possible.
        </p>
      )}

      {status === "voted" && (
        <p className="text-success mt-3">✅ Your vote has been recorded!</p>
      )}
      {status === "error" && (
        <p className="text-danger mt-3">❌ User already voted</p>
      )}
    </div>
  );
}
