import React, { useState, memo, useCallback } from "react";
import { useVariablePush } from "@/features/cpp-api/api";

interface VariableData {
  name: string;
  type: "BOOL" | "INT" | "FLOAT";
  value: number;
}

/**
 * Memoized card component to prevent unnecessary re-renders
 */
const VariableCard = memo((
  { varName, variable, onRemove }: 
  { varName: string; variable?: VariableData; onRemove: (name: string) => void }
) => {
  return (
    <div key={varName} style={styles.variableCard}>
      <div style={styles.variableHeader}>
        <h3>{variable?.name || varName}</h3>
        <button
          onClick={() => onRemove(varName)}
          style={styles.removeButton}
        >
          ✕
        </button>
      </div>

      {variable ? (
        <>
          <p>
            <strong>Type:</strong> {variable.type}
          </p>
          <p style={styles.value}>
            <strong>Value:</strong> {formatValue(variable.value, variable.type)}
          </p>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${Math.min(Math.abs(variable.value) / 100, 1) * 100}%`,
              }}
            />
          </div>
        </>
      ) : (
        <p style={styles.loading}>Fetching...</p>
      )}
    </div>
  );
});

VariableCard.displayName = "VariableCard";

/**
 * Example component demonstrating real-time variable monitoring
 * 
 * **Phase 3 Implementation** - Binary Protocol Streaming
 * 
 * Shows how to:
 * - Subscribe to variables with useVariablePush hook
 * - Display real-time updates via Binary Protocol
 * - Handle loading and error states
 */
export const VariableMonitor: React.FC = () => {
  const [selectedVars, setSelectedVars] = useState<string[]>([
    "flag",
    "counter",
    "temperature",
  ]);
  const [newVarName, setNewVarName] = useState("");

  const { variables, loading, error } =
    useVariablePush(selectedVars);

  const handleAddVariable = async () => {
    if (newVarName.trim() && !selectedVars.includes(newVarName)) {
      setSelectedVars([...selectedVars, newVarName]);
      setNewVarName("");
    }
  };

  const handleRemoveVariable = useCallback((varName: string) => {
    // Only remove from selectedVars - useEffect will handle unsubscribe
    setSelectedVars(prev => prev.filter((v) => v !== varName));
  }, []);

  return (
    <div style={styles.container}>
      <h2>Variable Monitor (Binary Protocol Streaming) ⚡</h2>

      {/* Add New Variable */}
      <div style={styles.section}>
        <input
          type="text"
          value={newVarName}
          onChange={(e) => setNewVarName(e.target.value)}
          placeholder="Enter variable name"
          style={styles.input}
        />
        <button onClick={handleAddVariable} style={styles.button}>
          Add Variable
        </button>
      </div>

      {/* Status */}
      {loading && <p style={styles.status}>Loading...</p>}
      {error && <p style={styles.error}>Error: {error}</p>}

      {/* Variables Display */}
      <div style={styles.variablesContainer}>
        {selectedVars.length === 0 ? (
          <p style={styles.placeholder}>No variables selected</p>
        ) : (
          selectedVars.map((varName) => (
            <VariableCard
              key={varName}
              varName={varName}
              variable={variables[varName]}
              onRemove={handleRemoveVariable}
            />
          ))
        )}
      </div>

      {/* Info */}
      <div style={styles.info}>
        <p>
          📡 <strong>Push Status:</strong> Connected to Variable Table
        </p>
        <p>✓ Real-time updates via Custom Binary Protocol (Base64)</p>
        <p>✓ Updates are batched and sent efficiently from backend</p>
        <p>✓ Delta tracking prevents sending unchanged values</p>
      </div>
    </div>
  );
};

/**
 * Format variable value based on type
 */
function formatValue(value: number, type: string): string {
  switch (type) {
    case "BOOL":
      return value !== 0 ? "true" : "false";
    case "INT":
      return Math.round(value).toString();
    case "FLOAT":
      return value.toFixed(2);
    default:
      return value.toString();
  }
}

// Styles
const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  } as React.CSSProperties,

  section: {
    marginBottom: "20px",
    padding: "15px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
  } as React.CSSProperties,

  input: {
    padding: "8px 12px",
    marginRight: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
  } as React.CSSProperties,

  button: {
    padding: "8px 16px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  } as React.CSSProperties,

  status: {
    color: "#666",
    fontSize: "14px",
    marginBottom: "10px",
  } as React.CSSProperties,

  error: {
    color: "#dc3545",
    padding: "10px",
    backgroundColor: "#f8d7da",
    borderRadius: "4px",
    marginBottom: "10px",
  } as React.CSSProperties,

  variablesContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "15px",
    marginBottom: "20px",
  } as React.CSSProperties,

  variableCard: {
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "15px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  } as React.CSSProperties,

  variableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  } as React.CSSProperties,

  removeButton: {
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: "18px",
  } as React.CSSProperties,

  value: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: "10px",
  } as React.CSSProperties,

  loading: {
    color: "#999",
    fontStyle: "italic",
  } as React.CSSProperties,

  progressBar: {
    width: "100%",
    height: "8px",
    backgroundColor: "#e9ecef",
    borderRadius: "4px",
    overflow: "hidden",
    marginTop: "10px",
  } as React.CSSProperties,

  progressFill: {
    height: "100%",
    backgroundColor: "#28a745",
    transition: "width 0.3s ease",
  } as React.CSSProperties,

  info: {
    backgroundColor: "#e7f3ff",
    border: "1px solid #b3d9ff",
    borderRadius: "8px",
    padding: "15px",
    marginTop: "20px",
  } as React.CSSProperties,

    placeholder: {
    color: "#999",
    fontStyle: "italic",
    } as React.CSSProperties,

};
