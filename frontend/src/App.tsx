
import { useState } from "react";
import "./App.css";


interface Commit {
  sha: string;
  html_url: string;
  message: string;
  authorName: string;
  commitDate: string | null;
}


interface CommitFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

interface CommitDetails {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: {
      name?: string;
      date?: string;
    };
  };
  files?: CommitFile[];
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}


function App() {
  const [owner, setOwner] = useState("microsoft");
  const [repo, setRepo] = useState("vscode");
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("Overview");
  const [dataSource, setDataSource] = useState<"github" | "database">("github");
  const [collapsedFiles, setCollapsedFiles] = useState<string[]>([]);
  
  const [selectedCommit, setSelectedCommit] =
    useState<CommitDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  
  async function fetchCommits() {
  setLoading(true);
  setError("");
  setCommits([]);

  try {
    const endpoint =
      dataSource === "github"
        ? "commits"
        : "commits/saved";

    const response = await fetch(
      `http://localhost:8081/api/github/${endpoint}?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
    );

    if (!response.ok) {
      throw new Error(`Request failed: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Unexpected response from the server.");
    }

    const normalizedCommits: Commit[] = data.map((item) => {
      if (dataSource === "github") {
        return {
          sha: item.sha,
          html_url: item.html_url,
          message: item.commit?.message ?? "",
          authorName:
            item.commit?.author?.name ??
            item.author?.login ??
            "Unknown author",
          commitDate: item.commit?.author?.date ?? null,
        };
      }

      return {
        sha: item.sha,
        html_url: item.htmlUrl,
        message: item.message ?? "",
        authorName: item.authorName ?? "Unknown author",
        commitDate: item.commitDate ?? null,
      };
    });

    setCommits(normalizedCommits);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Something went wrong."
    );
  } finally {
    setLoading(false);
  }
}
      function toggleFile(filename: string) {
        setCollapsedFiles((current) =>
          current.includes(filename)
            ? current.filter((name) => name !== filename)
            : [...current, filename]
        );
      }

  async function fetchCommitDetails(sha: string) {
    setDetailsLoading(true);
    setDetailsError("");
    setSelectedCommit(null);

    try {
      const response = await fetch(
        `http://localhost:8081/api/github/commits/details?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&sha=${encodeURIComponent(sha)}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load commit details: HTTP ${response.status}`
        );
      }

      const data: CommitDetails = await response.json();
      setSelectedCommit(data);
    } catch (err) {
      setDetailsError(
        err instanceof Error
          ? err.message
          : "Unable to load commit details."
      );
    } finally {
      setDetailsLoading(false);
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
            
            <div className="source-selector">
              <button
                type="button"
                className={dataSource === "github" ? "source-active" : ""}
                onClick={() => setDataSource("github")}
              >
                Live GitHub
              </button>

              <button
                type="button"
                className={dataSource === "database" ? "source-active" : ""}
                onClick={() => setDataSource("database")}
              >
                Saved in PostgreSQL
              </button>
            </div>

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
              const date = item.commitDate
                ? new Date(item.commitDate).toLocaleString()
                : "Date unavailable";

              return (
                <article className="commit-card" key={item.sha}>
                  <div className="commit-symbol">⑂</div>

                  <div className="commit-details">
                    <h3>{item.message.split("\n")[0]}</h3>

                    <div className="commit-metadata">
                      <span>{item.authorName}</span>
                      <span className="metadata-separator">·</span>
                      <span>{date}</span>
                    </div>
                  </div>
                  
                 <button
                    className="inspect-button"
                    type="button"
                    onClick={() => {
                      console.log("Inspect clicked:", item.sha);
                      void fetchCommitDetails(item.sha);
                    }}
                    disabled={detailsLoading}
                  >
                    Inspect changes
                  </button>
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

          {detailsLoading && (
            <div className="message-panel" role="status">
              Loading commit details...
            </div>
          )}

          {detailsError && (
            <div className="message-panel error-message" role="alert">
              <strong>Unable to load commit details</strong>
              <p>{detailsError}</p>
            </div>
          )}

          {selectedCommit && !detailsLoading && (
            <div className="details-panel">
              <div className="history-heading">
                <div>
                  <h2>Commit details</h2>
                  <p>{selectedCommit.commit.message.split("\n")[0]}</p>
                </div>
                <button
                  className="inspect-button"
                  type="button"
                  onClick={() => setSelectedCommit(null)}
                >
                  Close details
                </button>
              </div>

              <div className="diff-summary">
                <span>
                  {selectedCommit.stats?.total ?? 0} changes
                </span>
                <span className="additions">
                  +{selectedCommit.stats?.additions ?? 0}
                </span>
                <span className="deletions">
                  -{selectedCommit.stats?.deletions ?? 0}
                </span>
              </div>

              <h3>Changed files</h3>

               {selectedCommit.files?.length ? (
                selectedCommit.files.map((file) => {
                  const isCollapsed = collapsedFiles.includes(file.filename);

                  return (
                    <article className="file-card" key={file.filename}>
                      <button
                        className="file-heading file-heading-button"
                        type="button"
                        onClick={() => toggleFile(file.filename)}
                        aria-expanded={!isCollapsed}
                      >
                        <strong>
                          <span className="collapse-indicator">
                            {isCollapsed ? "▶" : "▼"}
                          </span>
                          {file.filename}
                        </strong>
                        <span>{file.status}</span>
                      </button>

                      {!isCollapsed && (
                        <div className="file-content">
                          <p>
                            <span className="additions">+{file.additions}</span>
                            {" / "}
                            <span className="deletions">-{file.deletions}</span>
                            {" lines"}
                          </p>

                          {file.patch && (
                            <pre className="diff-code">
                              {file.patch.split("\n").map((line, index) => {
                                const lineClass = line.startsWith("+")
                                  ? "diff-line diff-added"
                                  : line.startsWith("-")
                                    ? "diff-line diff-removed"
                                    : line.startsWith("@@")
                                      ? "diff-line diff-hunk"
                                      : "diff-line";

                                return (
                                  <span className={lineClass} key={index}>
                                    {line}
                                    {"\n"}
                                  </span>
                                );
                              })}
                            </pre>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })

              ) : (
                <p>No changed-file details are available.</p>
              )}
            </div>
          )}

        </section>

        <footer className="footer">
         <span>CommitCompass</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
