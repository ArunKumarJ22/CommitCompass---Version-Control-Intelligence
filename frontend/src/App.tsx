
import { useState } from "react";
import "./App.css";

interface Commit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    } | null;
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

function App() {
  const [owner, setOwner] = useState("react");
  const [repo, setRepo] = useState("react");
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchCommits() {
    setLoading(true);
    setError("");
    setCommits([]);

    try {
      const response = await fetch(
        `http://localhost:8081/api/github/commits?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      );

      if (!response.ok) {
        throw new Error(`Request failed: HTTP ${response.status}`);
      }

      const data: Commit[] = await response.json();
      setCommits(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app">
      <h1>CommitCompass</h1>
      <p>Explore the history of any public GitHub repository.</p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void fetchCommits();
        }}
      >
        <input
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          placeholder="Repository owner"
          aria-label="Repository owner"
          required
        />

        <input
          value={repo}
          onChange={(event) => setRepo(event.target.value)}
          placeholder="Repository name"
          aria-label="Repository name"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Fetch commits"}
        </button>
      </form>

      {error && <p role="alert">Error: {error}</p>}

      {commits.map((item) => (
        <article className="commit" key={item.sha}>
          <h3>{item.commit.message.split("\n")[0]}</h3>

          <p>
            Author: {item.commit.author?.name ?? item.author?.login ?? "Unknown"}
          </p>

          <p>
            Date:{" "}
            {item.commit.author?.date
              ? new Date(item.commit.author.date).toLocaleString()
              : "Unknown"}
          </p>

          <a href={item.html_url} target="_blank" rel="noreferrer">
            View commit on GitHub
          </a>
        </article>
      ))}
    </main>
  );
}

export default App;
