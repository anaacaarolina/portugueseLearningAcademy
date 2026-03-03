import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/test")
      .then((res) => res.json())
      .then((data) => setData(data.data));
  }, []);

  return (
    <div>
      <h1>React + FastAPI</h1>
      <p>{data}</p>
    </div>
  );
}

export default App;
