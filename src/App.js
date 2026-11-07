import React, { useEffect, useState } from "react";
import "./styles.css";

function App() {
  const [data, setData] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);
  const [uniqueMeasurements, setUniqueMeasurements] = useState([]);
  const [measurementData, setMeasurementData] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    fetch(`${process.env.REACT_APP_INFLUX_URL}/api/v2/query?orgID=2121303831818e03`, {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REACT_APP_INFLUX_TOKEN}`,
        "Content-Type": "application/vnd.flux",
        Accept: "application/csv",
      },
      body: `
        from(bucket: "MeterReader")
          |> range(start: -7d)
          |> filter(fn: (r) => r["_field"] == "MWH")
      `,
    })
      .then((res) => res.text())
      .then((csvText) => {
        const lines = csvText.trim().split(/\r?\n/);
        const headerIndex = lines.findIndex((line) => !line.startsWith("#"));
        const headers = lines[headerIndex].split(",");
        const rows = lines.slice(headerIndex + 1);

        const parsed = rows.map((line) => {
          const cols = line.split(",");
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = cols[i];
          });
          return obj;
        });

        const visualizerData = parsed.map((row) => ({
          _date: row._time?.split("T")[0] || "",
          _time: row._time?.split("T")[1]?.split(".")[0] || "",
          _mwh: row._value || "",
          _measurement: row._measurement || "",
        }));

        const dates = [...new Set(visualizerData.map((d) => d._date))];
        const measurements = [
          ...new Set(visualizerData.map((d) => d._measurement)),
        ];

        const grouped = {};
        measurements.forEach((m) => {
          grouped[m] = visualizerData.filter((d) => d._measurement === m);
        });

        setData(visualizerData);
        setUniqueDates(dates);
        setUniqueMeasurements(measurements);
        setMeasurementData(grouped);
        setActiveTab(measurements[0] || "");
      })
      .catch((err) => console.error("Failed to fetch data:", err));
  }, []);

  return (
    <div style={{ padding: "10px", backgroundColor: "#222", minHeight: "100vh" }}>
      <label htmlFor="dateSelect"><b style={{ color: "white" }}>Select DATE:</b></label>
      <select id="dateSelect" onChange={(e) => setSelectedDate(e.target.value)}>
        <option value="">All Dates</option>
        {uniqueDates.map((date) => (
          <option key={date} value={date}>
            {date}
          </option>
        ))}
      </select>

      <div className="tabs">
        {uniqueMeasurements.map((measure) => (
          <button
            key={measure}
            className={`tablink ${measure === activeTab ? "active" : ""}`}
            onClick={() => setActiveTab(measure)}
          >
            {measure}
          </button>
        ))}
      </div>

      {uniqueMeasurements.map((measure) => (
        <div
          key={measure}
          className="tabcontent"
          style={{ display: measure === activeTab ? "block" : "none" }}
        >
          <table className="tftable">
            <thead>
              <tr>
                <th>TIME</th>
                <th>MW:HR</th>
              </tr>
            </thead>
            <tbody>
              {measurementData[measure]
                ?.filter((row) => !selectedDate || row._date === selectedDate)
                .map((row, index) => (
                  <tr key={index}>
                    <td>{row._time}</td>
                    <td>{row._mwh}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default App;