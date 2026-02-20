import React, { useState, useRef, useCallback } from "react";
import { useVariablePush, useVariableControl } from "@/features/cpp-api/api";

/**
 * Example component demonstrating bidirectional variable control
 * 
 * **Phase 2 Implementation** - Push-based real-time updates
 * 
 * Shows how to:
 * - Read variable from backend (circle size) via push
 * - Write variable from frontend (slider)
 * - See real-time update loop: frontend → backend → frontend (no polling)
 */
export const CircleDemo: React.FC = () => {
  const { variables } = useVariablePush(["circleSize"]);
  const { setValue, error: setError } = useVariableControl();
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState<number | null>(null); // Optimistic UI
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced backend update (waits 100ms after last change)
  const debouncedSetValue = useCallback((value: number) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setUpdateError(null);
        await setValue("circleSize", "FLOAT", value);
        setLocalValue(null); // Reset optimistic value after backend confirms
      } catch (err) {
        setUpdateError(err instanceof Error ? err.message : "Failed to set value");
      }
    }, 100); // 100ms debounce
  }, [setValue]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    
    // Immediate optimistic UI update
    setLocalValue(newValue);
    
    // Debounced backend update
    debouncedSetValue(newValue);
  };

  // Use local optimistic value if available, otherwise backend value
  const circleSize = localValue ?? variables.circleSize?.value ?? 50;

  return (
    <div style={styles.container}>
      <h2>🎯 Circle Size Controller (Bidirectional) ⚡</h2>

      {/* Info */}
      <div style={styles.infoSection}>
        <p>
          <strong>Current Value:</strong> {circleSize.toFixed(1)}
          {localValue !== null && <span style={{ color: "#ff9800", marginLeft: "5px" }}>(updating...)</span>}
        </p>
        <p style={{ fontSize: "12px", color: "#666" }}>
          ✓ Debounced updates (100ms) prevent flooding • Optimistic UI for smooth UX
        </p>
      </div>

      {/* Circle Visualization */}
      <div style={styles.visualizationSection}>
        <h3>Circle Size: {circleSize.toFixed(1)}px</h3>
        <div style={styles.canvasContainer}>
          <svg width="400" height="400" style={styles.svg}>
            {/* Outer guide circle */}
            <circle
              cx="200"
              cy="200"
              r="180"
              fill="none"
              stroke="#ddd"
              strokeWidth="1"
              strokeDasharray="5,5"
            />

            {/* Interactive circle */}
            <circle
              cx="200"
              cy="200"
              r={Math.min(circleSize, 180)}
              fill="#007bff"
              opacity="0.7"
              style={{ transition: "r 0.2s ease" }}
            />

            {/* Value label */}
            <text
              x="200"
              y="205"
              textAnchor="middle"
              fontSize="24"
              fontWeight="bold"
              fill="white"
              style={{ pointerEvents: "none" }}
            >
              {circleSize.toFixed(0)}
            </text>
          </svg>
        </div>

        {/* Control slider */}
        <div style={styles.sliderSection}>
          <label>
            Adjust Size:
            <input
              type="range"
              min="10"
              max="180"
              step="1"
              value={circleSize}
              onChange={handleSliderChange}
              style={{ marginLeft: "10px", width: "200px" }}
            />
          </label>
          <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
            Slider value: {circleSize.toFixed(1)}
          </p>
        </div>

        {/* Error */}
        {(updateError || setError) && (
          <p style={styles.error}>
            Error: {updateError || setError}
          </p>
        )}
      </div>

      {/* Info Box */}
      <div style={styles.infoBox}>
        <h3>How it works:</h3>
        <ol style={{ fontSize: "14px", color: "#555" }}>
          <li>
            <strong>Frontend:</strong> User moves slider (changes localValue)
          </li>
          <li>
            <strong>API Call:</strong> setValue() sends to backend via set_variable
          </li>
          <li>
            <strong>Backend:</strong> VariableTable updates circleSize variable
          </li>
          <li>
            <strong>Frontend Poll:</strong> Push notification received instantly
          </li>
          <li>
            <strong>UI Update:</strong> Circle re-renders with new size
          </li>
        </ol>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "600px",
    margin: "20px auto",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  } as React.CSSProperties,

  infoSection: {
    backgroundColor: "#e7f3ff",
    border: "1px solid #b3d9ff",
    borderRadius: "4px",
    padding: "15px",
    marginBottom: "20px",
    fontSize: "14px",
  } as React.CSSProperties,

  visualizationSection: {
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
    textAlign: "center",
  } as React.CSSProperties,

  canvasContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  } as React.CSSProperties,

  svg: {
    border: "1px solid #eee",
    borderRadius: "4px",
    backgroundColor: "#fafafa",
  } as React.CSSProperties,

  sliderSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "15px",
  } as React.CSSProperties,

  error: {
    color: "#dc3545",
    backgroundColor: "#f8d7da",
    padding: "10px",
    borderRadius: "4px",
    marginTop: "10px",
  } as React.CSSProperties,

  infoBox: {
    backgroundColor: "#f0f0f0",
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "15px",
    fontSize: "13px",
  } as React.CSSProperties,
};
