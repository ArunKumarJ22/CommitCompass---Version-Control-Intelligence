
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("Connecting...");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8081/api/hello")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }

        return response.text();
      })
      .then((data) => setMessage(data))
      .catch(() => {
        setError("Could not connect to the backend.");
        setMessage("");
      });
  }, []);

  return (
    <main>
      <h1>CommitCompass</h1>
      <p>AI-powered version control intelligence</p>

      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <p>{message}</p>
      )}
    </main>
  );
}

export default App;
