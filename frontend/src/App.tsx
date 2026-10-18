

import "./App.css";
import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";

interface Commit {
  sha: string;
  html_url: string;
  message: string;
  authorName: string;
  commitDate: string | null;
}

interface RepositoryHistoryItem {
  owner: string;
  repo: string;
  lastExploredAt: string;
}

interface PullRequest {
  number: number;
  title: string;
  state: string;
  html_url: string;
  draft: boolean;
  user: {
    login: string;
  };
  created_at: string;
  body: string | null;
}

interface PullRequestFile {
  sha: string;
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  blob_url: string;
}


interface PullRequestCheck {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed" | string;
  conclusion: string | null;
  html_url: string;
  details_url?: string;
  output?: {
    title?: string | null;
    summary?: string | null;
  };
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
      email?: string;
      date?: string;
    };
    committer?: {
      name?: string;
      date?: string;
    };
  };
  author?: {
    login?: string;
    html_url?: string;
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
  const [dataSource, setDataSource] = useState<"github" | "database">("github");
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [activePage, setActivePage] = useState("Overview");

  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [pullRequestsLoading, setPullRequestsLoading] = useState(false);
  const [pullRequestsError, setPullRequestsError] = useState("");

  
  const [selectedPullRequest, setSelectedPullRequest] =
  useState<PullRequest | null>(null);

  const [pullRequestFiles, setPullRequestFiles] =
  useState<PullRequestFile[]>([]);

  const [pullRequestFilesLoading, setPullRequestFilesLoading] =
  useState(false);

  const [pullRequestFilesError, setPullRequestFilesError] =
  useState("");
  const [pullRequestChecks, setPullRequestChecks] =
  useState<PullRequestCheck[]>([]);

  const [pullRequestChecksLoading, setPullRequestChecksLoading] =
  useState(false);

  const [pullRequestChecksError, setPullRequestChecksError] =
  useState("");

  
  const [prRiskAnalysis, setPrRiskAnalysis] = useState("");
  const [prRiskLevels, setPrRiskLevels] = useState<Record<number, string>>({});
  const [prRiskLoading, setPrRiskLoading] = useState(false);
  const [prRiskError, setPrRiskError] = useState("");

  const [prDetailView, setPrDetailView] = useState<"files" | "checks">("files");

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [selectedCommit, setSelectedCommit] =
    useState<CommitDetails | null>(null);

  const [collapsedFiles, setCollapsedFiles] = useState<string[]>([]);

  const [riskAnalysis, setRiskAnalysis] = useState("");
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState("");

  const [repositoryHistory, setRepositoryHistory] = useState<
  RepositoryHistoryItem[]
  >(() => {
  try {
    const saved = localStorage.getItem("commitcompass-repository-history");
    return saved ? JSON.parse(saved) as RepositoryHistoryItem[] : [];
  } catch {
    return [];
  }
  });

  useEffect(() => {
    void fetchRepositoryHistory();
  }, []);


  async function fetchCommits(
    selectedOwner = owner,
    selectedRepo = repo
) {
  setLoading(true);
  setError("");
  setCommits([]);

  try {
    const endpoint =
      dataSource === "github"
        ? "commits"
        : "commits/saved";

    const response = await fetch(
      `http://localhost:8081/api/github/${endpoint}?owner=${encodeURIComponent(selectedOwner)}&repo=${encodeURIComponent(selectedRepo)}`
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

      // Saving repository history is secondary to loading commits.
      // A history failure should not make a successful commit request appear to fail.
      try {
        const historyResponse = await fetch(
          `http://localhost:8081/api/repositories/history?owner=${encodeURIComponent(selectedOwner.trim())}&repo=${encodeURIComponent(selectedRepo.trim())}`,
          { method: "POST" }
        );

        if (historyResponse.ok) {
          await fetchRepositoryHistory();
        }
      } catch (historyError) {
        console.error("Unable to save repository history:", historyError);
      }

      const historyItem: RepositoryHistoryItem = {
      owner: owner.trim(),
      repo: repo.trim(),
      lastExploredAt: new Date().toISOString(),
    };

    setRepositoryHistory((current) => {
      const updated = [
        historyItem,
        ...current.filter(
          (item) =>
            item.owner.toLowerCase() !== historyItem.owner.toLowerCase() ||
            item.repo.toLowerCase() !== historyItem.repo.toLowerCase()
        ),
      ].slice(0, 10);

      localStorage.setItem(
        "commitcompass-repository-history",
        JSON.stringify(updated)
      );

      return updated;
    });
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

      
    async function fetchRepositoryHistory() {
      try {
        const response = await fetch(
          "http://localhost:8081/api/repositories/history"
        );

        if (!response.ok) {
          throw new Error("Failed to load repository history.");
        }

        const data: RepositoryHistoryItem[] = await response.json();
        setRepositoryHistory(data);
      } catch (err) {
        console.error("Repository history error:", err);
      }
    }

  async function fetchPullRequests() {
    setPullRequestsLoading(true);
    setPullRequestsError("");
    setPullRequests([]);

    try {
      const response = await fetch(
        `http://localhost:8081/api/github/pulls?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : `Failed to load pull requests: HTTP ${response.status}`
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected pull request response.");
      }

      setPullRequests(data);
    } catch (err) {
      setPullRequestsError(
        err instanceof Error
          ? err.message
          : "Unable to load pull requests."
      );
    } finally {
      setPullRequestsLoading(false);
    }
  }
  

  async function fetchPullRequestChecks(pullRequest: PullRequest) {
    setSelectedPullRequest(pullRequest);
    setPullRequestChecks([]);
    setPullRequestChecksError("");
    setPullRequestChecksLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8081/api/github/pulls/${pullRequest.number}/checks?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : `Failed to load CI checks: HTTP ${response.status}`
        );
      }

      if (!Array.isArray(data.check_runs)) {
        throw new Error("Unexpected CI checks response from the server.");
      }

      setPullRequestChecks(data.check_runs);
    } catch (error) {
      setPullRequestChecksError(
        error instanceof Error
          ? error.message
          : "Unable to load CI checks."
      );
    } finally {
      setPullRequestChecksLoading(false);
    }
  }


  async function fetchPullRequestFiles(pullRequest: PullRequest) {
    setSelectedPullRequest(pullRequest);
    setPullRequestFilesError("");
    setPullRequestFilesLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8081/api/github/pulls/${pullRequest.number}/files?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to load changed files: HTTP ${response.status}`);
      }

      const files: PullRequestFile[] = await response.json();
      setPullRequestFiles(files);
    } catch (error) {
      setPullRequestFilesError(
        error instanceof Error ? error.message : "Unable to load changed files."
      );
    } finally {
      setPullRequestFilesLoading(false);
    }
  }

  
  async function analyzePullRequestRisk() {
    if (!selectedPullRequest || pullRequestFiles.length === 0) {
      setPrRiskError("Select a pull request and load its changed files first.");
      return;
    }

    setPrRiskAnalysis("");
    setPrRiskError("");

    const diff = pullRequestFiles
      .filter((file) => file.patch)
      .map((file) => `File: ${file.filename}\n${file.patch}`)
      .join("\n\n");

    if (!diff.trim()) {
      setPrRiskError("No text patches are available for this pull request.");
      return;
    }

    if (diff.length > 30000) {
      setPrRiskError(
        "This pull request's diff is too large to analyze in one request."
      );
      return;
    }

    setPrRiskLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8081/api/ai/risk-analysis",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ diff }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? `AI risk analysis failed: HTTP ${response.status}`
        );
      }

      if (typeof data.analysis !== "string") {
        throw new Error("The server returned an invalid risk analysis.");
      }

      setPrRiskAnalysis(data.analysis);
      
      const riskMatch = data.analysis.match(
        /(?:overall\s+risk\s+level|risk\s+level)\s*[:\-]?\s*(?:\*{1,2})?\s*(low|medium|high)\b/i
      ) ?? data.analysis.match(
        /(?:#{1,6}\s*)?(?:\*{1,2})?overall\s+risk\s+level(?:\*{1,2})?\s*[:\-]?\s*\n+\s*(?:\*{1,2})?\s*(low|medium|high)\b/i
      );

      const riskLevel = riskMatch?.[1]?.toLowerCase();

      if (riskLevel && selectedPullRequest) {
        setPrRiskLevels(previous => ({
          ...previous,
          [selectedPullRequest.number]: riskLevel,
        }));
      }

    } catch (error) {
      setPrRiskError(
        error instanceof Error
          ? error.message
          : "Unable to analyze this pull request."
      );
    } finally {
      setPrRiskLoading(false);
    }
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

  
    async function explainSelectedCommit() {
      if (!selectedCommit) {
        return;
      }

      setAiExplanation("");
      setAiError("");

      const files = selectedCommit.files ?? [];
      const diff = files
        .filter((file) => file.patch)
        .map((file) => `File: ${file.filename}\n${file.patch}`)
        .join("\n\n");

      if (!diff.trim()) {
        setAiError(
          "No code patches are available for this commit."
        );
        return;
      }

      if (diff.length > 30000) {
        setAiError(
          "This diff is too large. Please inspect a smaller commit."
        );
        return;
      }

      setAiLoading(true);

      try {
        const response = await fetch(
          "http://localhost:8081/api/ai/explain",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ diff }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ?? `AI request failed: HTTP ${response.status}`
          );
        }

        if (typeof data.explanation !== "string") {
          throw new Error("The server returned an invalid explanation.");
        }

        const cleanedExplanation = data.explanation
          .replace(/\\([#*_`])/g, "$1")
          .replace(/\\n/g, "\n");

        setAiExplanation(cleanedExplanation);
      } catch (err) {
        setAiError(
          err instanceof Error
            ? err.message
            : "Unable to generate an AI explanation."
        );
      } finally {
        setAiLoading(false);
      }
    }


    async function analyzeSelectedCommitRisk() {
      if (!selectedCommit) return;

      setRiskAnalysis("");
      setRiskError("");

      const diff = (selectedCommit.files ?? [])
        .filter((file) => file.patch)
        .map((file) => `File: ${file.filename}\n${file.patch}`)
        .join("\n\n");

      if (!diff.trim()) {
        setRiskError("No code patches are available for this commit.");
        return;
      }

      if (diff.length > 30000) {
        setRiskError("This diff is too large to analyze.");
        return;
      }

      setRiskLoading(true);

      try {
        const response = await fetch(
          "http://localhost:8081/api/ai/risk-analysis",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ diff }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ?? `Risk analysis failed: HTTP ${response.status}`
          );
        }

        if (typeof data.analysis !== "string") {
          throw new Error("The server returned an invalid risk analysis.");
        }

        const cleanedAnalysis = data.analysis
          .replace(/\\([#*_`])/g, "$1")
          .replace(/\\n/g, "\n");

        setRiskAnalysis(cleanedAnalysis);
      } catch (err) {
        setRiskError(
          err instanceof Error
            ? err.message
            : "Unable to analyze commit risk."
        );
      } finally {
        setRiskLoading(false);
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
            { name: "Pull Requests", icon: "⑂" },
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

        <section className="welcome-section"
        style={{ display: activePage === "Overview" ? undefined : "none" }}>
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

        <section className="search-panel"
        style={{
          display:
            activePage === "Overview" || activePage === "Repositories"
              ? undefined
                : "none",
        }}>
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

        
      {activePage === "Repositories" && (
        <section className="history-section">
          <div className="history-heading">
            <div>
              <h2>Recently explored</h2>
              <p>Your latest GitHub repository searches</p>
            </div>

            <span className="result-count">
              {repositoryHistory.length} repositories
            </span>
          </div>

          {repositoryHistory.length === 0 ? (
            <div className="empty-state">
              <h3>No repository history yet</h3>
              <p>
                Explore a repository above, and it will appear here.
              </p>
            </div>
          ) : (
            repositoryHistory.map((item) => (
              <article
                className="commit-card"
                key={`${item.owner}/${item.repo}`}
              >
                <div className="commit-symbol">▤</div>

                <div className="commit-details">
                  <h3>
                    {item.owner}/{item.repo}
                  </h3>
                  <p>
                    Last explored:{" "}
                    {new Date(item.lastExploredAt).toLocaleString()}
                  </p>
                </div>

                
              
              <button
                className="inspect-button"
                type="button"
                onClick={() => {
                  setOwner(item.owner);
                  setRepo(item.repo);
                  setActivePage("Commit History");
                  void fetchCommits();
                }}
                disabled={loading}
              >
                Explore repository
              </button>


              </article>
            ))
          )}
        </section>
      )}


        <section className="stats-grid"
        style={{ display: activePage === "Overview" ? undefined : "none" }}
         aria-label="Repository summary">
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

        <section className="history-section" 
        style={{
          display:
            activePage === "Overview" || activePage === "Commit History"
              ? undefined
                : "none",
          }}>
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

                  <p>
                    {selectedCommit.commit.message.split("\n")[0]}
                  </p>

                  <div className="commit-metadata">
                    <span>
                      Author: {selectedCommit.commit.author?.name ?? "Unknown"}
                    </span>

                    <span className="metadata-separator">·</span>

                    <span>
                      {selectedCommit.commit.author?.date
                        ? new Date(
                            selectedCommit.commit.author.date
                          ).toLocaleString()
                        : "Date unavailable"}
                    </span>
                  </div>

                  <p className="commit-sha">
                    SHA: {selectedCommit.sha}
                  </p>
                </div>

                <button
                  className="inspect-button"
                  type="button"
                  onClick={() => setSelectedCommit(null)}
                >
                  Close details
                </button>
              </div>

          {prDetailView === "files" && (
            <>
              <div className="diff-summary diff-summary-cards">
                <div className="diff-stat">
                  <span className="diff-stat-label">Files changed</span>
                  <strong>{selectedCommit.files?.length ?? 0}</strong>
                </div>

                <div className="diff-stat">
                  <span className="diff-stat-label">Lines added</span>
                  <strong className="additions">
                    +{selectedCommit.stats?.additions ?? 0}
                  </strong>
                </div>

                <div className="diff-stat">
                  <span className="diff-stat-label">Lines removed</span>
                  <strong className="deletions">
                    −{selectedCommit.stats?.deletions ?? 0}
                  </strong>
                </div>
              </div>
            </>
          )}

              
              
              <div className="ai-toolbar">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => void explainSelectedCommit()}
                  disabled={aiLoading}
                >
                  {aiLoading ? "Analyzing code..." : "Explain with AI"}
                </button>

                <button
                  className="primary-button risk-button"
                  type="button"
                  onClick={() => void analyzeSelectedCommitRisk()}
                  disabled={riskLoading}
                >
                  {riskLoading ? "Analyzing risk..." : "Analyze Risk"}
                </button>
              </div>

              {aiLoading && (
                <div className="message-panel" role="status">
                  AI is analyzing the commit changes. Please wait...
                </div>
              )}

              {aiError && (
                <div className="message-panel error-message" role="alert">
                  <strong>Unable to explain this commit</strong>
                  <p>{aiError}</p>
                </div>
              )}

              {aiExplanation && (
                <article className="ai-explanation-card">
                  <h3>AI Commit Explanation</h3>
                  <div className="ai-explanation-text">
                    <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                  </div>
                </article>
              )}

              {riskLoading && (
                <div className="message-panel" role="status">
                  Assessing potential risks and regressions...
                </div>
              )}

              {riskError && (
                <div className="message-panel error-message" role="alert">
                  <strong>Risk analysis failed</strong>
                  <p>{riskError}</p>
                </div>
              )}

              {riskAnalysis && (
                <article className="ai-explanation-card">
                  <h3>AI Risk Analysis</h3>
                  <div className="ai-explanation-text">
                    <ReactMarkdown>{riskAnalysis}</ReactMarkdown>
                  </div>
                </article>
              )}


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

        {activePage === "Pull Requests" && (
          <section className="history-section">
            <div className="history-heading">
              <div>
                <h2>
                  Open pull requests
                  <span className="pr-count">{pullRequests.length}</span>
                </h2>
                <p>
                  Showing open pull requests for {owner}/{repo}
                </p>
              </div>

              <button
                className="inspect-button"
                type="button"
                onClick={() => void fetchPullRequests()}
                disabled={pullRequestsLoading}
              >
                {pullRequestsLoading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {pullRequestsError && (
              <div className="message-panel error-message" role="alert">
                {pullRequestsError}
              </div>
            )}

            {pullRequestsLoading && (
              <div className="message-panel" role="status">
                Loading pull requests from GitHub...
              </div>
            )}

            {!pullRequestsLoading &&
              !pullRequestsError &&
              pullRequests.length === 0 && (
                <div className="empty-state">
                  <h3>No pull requests loaded</h3>
                  <p>
                    Click Refresh to load open pull requests for this repository.
                  </p>
                </div>
              )}

            {pullRequests.map((pr) => (
              <article className="commit-card" key={pr.number}>
                <div className="commit-symbol">⑂</div>

                <div className="commit-details">
                  <h3>
                    #{pr.number} — {pr.title}
                  </h3>
                    
                  {prRiskLevels[pr.number] && (
                    <div className={`risk-badge risk-${prRiskLevels[pr.number]}`}>
                      <span className="risk-indicator" />
                      {prRiskLevels[pr.number].charAt(0).toUpperCase() +
                        prRiskLevels[pr.number].slice(1)} Risk
                    </div>
                  )}


                  <div className="commit-metadata">
                    <span>{pr.user?.login ?? "Unknown author"}</span>
                    <span className="metadata-separator">·</span>
                    <span className={`pr-status ${pr.draft ? "draft" : "open"}`}>
                    {pr.draft ? "Draft" : "Open"}
                    </span>
                    <span className="metadata-separator">·</span>
                    <span>
                      {new Date(pr.created_at).toLocaleDateString()}
                    </span>
                  </div>
                   
                  <button
                    className="inspect-button"
                    type="button"
                    onClick={() => {
  setPrDetailView("files");
  void fetchPullRequestFiles(pr);
}}
                  >
                    {pullRequestFilesLoading && selectedPullRequest?.number === pr.number
                      ? "Loading files..."
                      : "View changed files"}
                  </button>

                  
                 
<button
  className="inspect-button"
  type="button"
  onClick={() => {
    setPrDetailView("checks");
    void fetchPullRequestChecks(pr);
  }}
  disabled={pullRequestChecksLoading}
>
  {pullRequestChecksLoading &&
  selectedPullRequest?.number === pr.number
    ? "Loading checks..."
    : "View CI Checks"}
</button>
    


                  {pr.body && <p>{pr.body}</p>}
                </div>

                <a
                  className="commit-link"
                  href={pr.html_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open on GitHub ↗
                </a>
              </article>
            ))}
            
            {selectedPullRequest && (
              <div className="details-panel">
                <div className="history-heading">
                  <div>
                    <h2>
                      {prDetailView === "files" ? "Changed files" : "CI Checks"}
                      {" — PR #"}
                      {selectedPullRequest.number}
                    </h2>
                    <p>{selectedPullRequest.title}</p> 
                    {prDetailView === "checks" && (
                    <>
                      {pullRequestChecksLoading && (
                       <p>Loading CI checks...</p>
                      )}

                    {pullRequestChecksError && (
                      <p className="error-message">
                        {pullRequestChecksError}
                      </p>
                    )}

                    {!pullRequestChecksLoading &&
                      !pullRequestChecksError &&
                      pullRequestChecks.length === 0 && (
                        <p>No CI checks loaded yet. Click "View CI Checks" on a pull request.</p>
                      )}
                      </>
                    )}
                  </div>
                  <div className="history-actions">
                    <button
                      className="inspect-button"
                      type="button"
                      onClick={() => {
                        setPrDetailView("files");
                        void fetchPullRequestFiles(selectedPullRequest);
                      }}
                      disabled={pullRequestFilesLoading}
                    >
                      {pullRequestFilesLoading
                        ? "Loading files..."
                        : "View changed files"}
                    </button>

                  {prDetailView === "checks" &&
                    pullRequestChecks.length > 0 && (
                      <div className="ci-checks-list">
                        <h3>CI Checks ({pullRequestChecks.length})</h3>
                        <div className="ci-summary">
                          <span>
                            Passed:{" "}
                            {pullRequestChecks.filter(
                              (check) =>
                                check.status === "completed" &&
                                check.conclusion === "success"
                            ).length}
                          </span>

                          <span>
                            Failed:{" "}
                            {pullRequestChecks.filter(
                              (check) =>
                                check.conclusion === "failure" ||
                                check.conclusion === "timed_out"
                            ).length}
                          </span>

                          <span>
                            Running:{" "}
                            {
                              pullRequestChecks.filter(
                                (check) =>
                                  check.status === "in_progress" ||
                                  check.status === "queued"
                              ).length
                            }
                          </span>
                        </div>

                        {pullRequestChecks.map((check) => (
                          <div className="commit-card" key={check.id}>
                            <strong>{check.name}</strong>

                            <p
                              className={`ci-status ${
                                check.status !== "completed"
                                  ? "ci-running"
                                  : check.conclusion === "success"
                                    ? "ci-passed"
                                    : check.conclusion === "failure" ||
                                        check.conclusion === "timed_out"
                                      ? "ci-failed"
                                      : "ci-neutral"
                              }`}
                            >
                              Status:{" "}
                              {check.status !== "completed"
                                ? check.status === "in_progress"
                                  ? "Running"
                                  : "Queued"
                                : check.conclusion ?? "Completed"}
                            </p>

                            {check.output?.title && (
                              <p>{check.output.title}</p>
                            )}

                            {(check.html_url || check.details_url) && (
                              <a
                                href={check.details_url || check.html_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View check details ↗
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {prDetailView === "files" && (
                                        <div className="diff-summary diff-summary-cards">
                      <div className="diff-stat">
                        <span className="diff-stat-label">Files changed</span>
                        <strong>{pullRequestFiles.length}</strong>
                      </div>

                      <div className="diff-stat">
                        <span className="diff-stat-label">Lines added</span>
                        <strong className="additions">
                          +{pullRequestFiles.reduce((total, file) => total + file.additions, 0)}
                        </strong>
                      </div>

                      <div className="diff-stat">
                        <span className="diff-stat-label">Lines removed</span>
                        <strong className="deletions">
                          −{pullRequestFiles.reduce((total, file) => total + file.deletions, 0)}
                        </strong>
                      </div>

                      <div className="diff-stat">
                        <span className="diff-stat-label">Files with text diffs</span>
                        <strong>
                          {pullRequestFiles.filter(file => Boolean(file.patch)).length}
                        </strong>
                      </div>
                    </div>
)}
                    <div className="ai-toolbar">
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => void analyzePullRequestRisk()}
                        disabled={prRiskLoading || pullRequestFilesLoading}
                      >
                        {prRiskLoading ? "Analyzing PR..." : "Analyze PR Risk with AI"}
                      </button>
                      
                    </div>

                    {prRiskLoading && (
                      <div className="message-panel" role="status">
                        AI is reviewing the pull request changes...
                      </div>
                    )}

                    {prRiskError && (
                      <div className="message-panel error-message" role="alert">
                        {prRiskError}
                      </div>
                    )}

                    {prRiskAnalysis && (
                    <article className="ai-explanation-card">
                      <h3>AI Pull Request Risk Review</h3>
                      
                      <button
                        className="inspect-button"
                        type="button"
                        onClick={() => {
                          const report = [
                            `# AI Pull Request Risk Review`,
                            ``,
                            `Repository: ${owner}/${repo}`,
                            `Pull Request: #${selectedPullRequest.number} — ${selectedPullRequest.title}`,
                            ``,
                            prRiskAnalysis,
                          ].join("\n");

                          void navigator.clipboard.writeText(report).then(
                            () => window.alert("AI review copied to clipboard."),
                            () => window.alert("Unable to copy the review. Please try again.")
                          );
                        }}
                      >
                        Copy Review
                      </button>

                      <div className="pr-findings-summary">
                        <div className="pr-finding">
                          <span>Changed files reviewed</span>
                          <strong>{pullRequestFiles.length}</strong>
                        </div>

                        <div className="pr-finding">
                          <span>Files with text diffs</span>
                          <strong>
                            {pullRequestFiles.filter(file => Boolean(file.patch)).length}
                          </strong>
                        </div>

                        <div className="pr-finding">
                          <span>Lines added</span>
                          <strong className="additions">
                            +{pullRequestFiles.reduce((total, file) => total + file.additions, 0)}
                          </strong>
                        </div>

                        <div className="pr-finding">
                          <span>Lines removed</span>
                          <strong className="deletions">
                            −{pullRequestFiles.reduce((total, file) => total + file.deletions, 0)}
                          </strong>
                        </div>
                      </div>


                      {(() => {
                        
                    const match = prRiskAnalysis.match(
                      /(?:overall\s+risk\s+level|risk\s+level)\s*[:\-]?\s*(?:\*{1,2})?\s*(low|medium|high)\b/i
                    ) ?? prRiskAnalysis.match(
                      /(?:#{1,6}\s*)?(?:\*{1,2})?overall\s+risk\s+level(?:\*{1,2})?\s*[:\-]?\s*\n+\s*(?:\*{1,2})?\s*(low|medium|high)\b/i
                    );
                    const riskLevel = match?.[1]?.toLowerCase();


                        
                      return riskLevel ? (
                        <div className="risk-overview">
                          <div className={`risk-badge risk-${riskLevel}`}>
                            <span className="risk-indicator" />
                            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
                          </div>

                          <p className="risk-summary">
                            {(() => {
                              const text = prRiskAnalysis
                                .replace(/^#{1,6}\s+.*$/gm, "")
                                .replace(/[*_`]/g, "")
                                .replace(/^\s*[-*]\s+/gm, "")
                                .replace(/^\s*\d+\.\s+/gm, "")
                                .split(/\n+/)
                                .map(line => line.trim())
                                .find(line =>
                                  line.length > 35 &&
                                  !/^(potential bugs|regression risks|recommended tests|missing tests|recommended actions)\b/i.test(line)
                                );

                              return text
                                ? text.length > 220
                                  ? `${text.slice(0, 217).trimEnd()}...`
                                  : text
                                : "Review the analysis below for details about this risk level.";
                            })()}
                          </p>
                        </div>
                      ) : null;

                      })()}

                      <div className="ai-explanation-text">
                        <ReactMarkdown>{prRiskAnalysis}</ReactMarkdown>
                      </div>
                    </article>

                    )}

                  </div>

                  <button
                    className="inspect-button close-files-button"
                    type="button"
                    onClick={() => {
                      setSelectedPullRequest(null);
                      setPullRequestFiles([]);
                      setPullRequestFilesError("");
                    }}
                  >
                    Close files
                  </button>
                </div>
              {prDetailView === "files" && (
                <>
                {pullRequestFilesLoading && (
                  <div className="message-panel" role="status">
                    Loading changed files...
                  </div>
                )}

                {pullRequestFilesError && (
                  <div className="message-panel error-message" role="alert">
                    {pullRequestFilesError}
                  </div>
                )}

                {!pullRequestFilesLoading &&
                  !pullRequestFilesError &&
                  selectedPullRequest &&
                  pullRequestFiles.length === 0 && (
                    <p>No changed files were returned for this pull request.</p>
                )}

                {!pullRequestFilesLoading &&
                  pullRequestFiles.map((file) => (
                    <article className="file-card" key={file.sha + file.filename}>
                      <div className="file-heading">
                        <strong>{file.filename}</strong>
                        <span>{file.status}</span>
                      </div>

                      <div className="file-content">
                        <p>
                          <span className="additions">+{file.additions}</span>
                          {" / "}
                          <span className="deletions">-{file.deletions}</span>
                          {" lines"}
                        </p>

                        {file.patch ? (
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
                        ) : (
                          <p>Text diff unavailable for this file.</p>
                        )}
                      </div>
                    </article>
                  ))}
                    </>
)}
              </div>
            )}

          </section>
          
        )}

        <footer className="footer">
         <span>CommitCompass</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
