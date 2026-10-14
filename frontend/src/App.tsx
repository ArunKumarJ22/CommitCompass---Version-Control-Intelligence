
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
  const [owner, setOwner] = useState("microsoft");
  const [repo, setRepo] = useState("vscode");
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("Overview");

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

      if (!Array.isArray(data)) {
        throw new Error("Unexpected response from the server.");
      }

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
    <div className="dashboard">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="CommitCompass home">
          <img
            className="brand-logo"
             src="/commitcompass-logo.png"
              alt="CommitCompass logo"
            />
        </a>

        <p className="nav-label">WORKSPACE</p>

        <nav className="navigation" aria-label="Main navigation">
          {[
            { name: "Overview", icon: "▦" },
            { name: "Commit History", icon: "⑂" },
            { name: "Repositories", icon: "▤" },
          ].map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon">?</span>
            <div>
              <strong>Need help?</strong>
              <p>Explore your code activity.</p>
            </div>
          </div>
          <p className="version">CommitCompass</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Workspace / {activePage}</p>
            <h1>{activePage}</h1>
          </div>

          <div className="connection-status">
            <span className="status-dot" />
            GitHub insights
          </div>
        </header>

        <section className="welcome-section">
          <div>
            <p className="eyebrow">YOUR DEVELOPMENT WORKSPACE</p>
            <h2>Understand your code, at a glance.</h2>
            <p className="welcome-description">
              Explore commit history and discover what is happening
              in your favorite repositories.
            </p>
          </div>
          <div className="welcome-decoration" aria-hidden="true">
            {"</>"}
          </div>
        </section>

        <section className="search-panel">
          <div className="section-heading">
            <div>
              <h2>Explore a repository</h2>
              <p>Enter a public GitHub repository to get started.</p>
            </div>
            <span className="github-label">GitHub API</span>
          </div>

          <form
            className="repository-form"
            onSubmit={(event) => {
              event.preventDefault();
              void fetchCommits();
            }}
          >
            <label>
              Repository owner
              <input
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
                placeholder="e.g. microsoft"
                required
              />
            </label>

            <label>
              Repository name
              <input
                value={repo}
                onChange={(event) => setRepo(event.target.value)}
                placeholder="e.g. vscode"
                required
              />
            </label>

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Loading..." : "Explore repository"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>
        </section>

        <section className="stats-grid" aria-label="Repository summary">
          <article className="stat-card">
            <div className="stat-icon blue">⑂</div>
            <p>Commits loaded</p>
            <strong>{commits.length}</strong>
            <span>Returned by the API</span>
          </article>

          <article className="stat-card">
            <div className="stat-icon purple">▤</div>
            <p>Repository</p>
            <strong className="repository-stat">
              {owner && repo ? `${owner}/${repo}` : "—"}
            </strong>
            <span>Selected project</span>
          </article>

          <article className="stat-card">
            <div className="stat-icon green">✓</div>
            <p>Connection</p>
            <strong className="connection-stat">
              {error ? "Error" : loading ? "Loading" : commits.length ? "Connected" : "Ready"}
            </strong>
            <span>
              {error ? "Request failed" : "Spring Boot · Port 8081"}
            </span>
          </article>
        </section>

        <section className="history-section">
          <div className="history-heading">
            <div>
              <h2>Recent commits</h2>
              <p>
                {commits.length
                  ? `Showing ${commits.length} commits for ${owner}/${repo}`
                  : "Your repository activity will appear here."}
              </p>
            </div>

            <span className="result-count">{commits.length} results</span>
          </div>

          {loading && (
            <div className="message-panel" role="status">
              Fetching commits from GitHub...
            </div>
          )}

          {error && (
            <div className="message-panel error-message" role="alert">
              <strong>Unable to load commits</strong>
              <p>{error}</p>
              <p>Check your repository details and try again.</p>
            </div>
          )}

          {!loading && !error && commits.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">⑂</div>
              <h3>Your commit history starts here</h3>
              <p>
                Click “Explore repository” to load the latest commits.
              </p>
            </div>
          )}

          {!loading &&
            commits.map((item) => {
              const author =
                item.commit.author?.name ??
                item.author?.login ??
                "Unknown author";

              const date = item.commit.author?.date
                ? new Date(item.commit.author.date).toLocaleString()
                : "Date unavailable";

              return (
                <article className="commit-card" key={item.sha}>
                  <div className="commit-symbol">⑂</div>

                  <div className="commit-details">
                    <h3>{item.commit.message.split("\n")[0]}</h3>
                    <div className="commit-metadata">
                      <span>{author}</span>
                      <span className="metadata-separator">·</span>
                      <span>{date}</span>
                    </div>
                  </div>

                  <a
                    className="commit-link"
                    href={item.html_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View commit <span aria-hidden="true">↗</span>
                  </a>
                </article>
              );
            })}
        </section>

        <footer className="footer">
         <span>CommitCompass</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
