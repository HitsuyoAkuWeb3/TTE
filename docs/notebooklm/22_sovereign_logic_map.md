# Sovereign Logic Map (Mermaid)

## 1. The Autopoietic Loop (Core Gameplay)
```mermaid
graph TD
    A[Start: INTRO] --> B{Calibration Done?}
    B -- No --> C[CALIBRATION PHASE]
    B -- Yes --> D[ARMORY AUDIT]
    
    D --> E{Items < 3?}
    E -- Yes --> D
    E -- No --> F[TOOL COMPRESSION]
    
    F --> G[Generate Candidates]
    G --> H[EVIDENCE SCORING]
    
    H --> I{Score > 3.0?}
    I -- No --> J[Adversarial Challenge]
    J --> H
    I -- Yes --> K[TOOL LOCK]
    
    K --> L[VALUE SYNTHESIS]
    L --> M[Theory of Value]
    M --> N[INSTALLATION]
    
    N --> O[RITUAL DASHBOARD]
    O --> P{Daily Entry?}
    P -- Yes --> Q[End Loop / Ouroboros]
    Q --> O
```

## 2. World Forge Logic (Tier 5)
```mermaid
graph TD
    A[Ritual Dashboard] --> B{Active Tool Locked?}
    B -- No --> C[Greyed Out]
    B -- Yes --> D[Click 'World Forge']
    
    D --> E[Select Archetype]
    E --> F[Generate Scenario (AI)]
    F --> G[Run Simulation]
    
    G --> H{Score > 70?}
    H -- No --> I[Fail: +10 XP (Effort)]
    H -- Yes --> J[Pass: +60 XP (Victory)]
    
    J --> K[Update SystemState.simulationHistory]
    K --> L[Unlock 'Sovereign' Rank Potential]
```

## 3. Data Persistence Flow
```mermaid
sequenceDiagram
    participant UI as React UI
    participant State as SystemState (Local)
    participant API as /api/db/sessions
    participant DB as Neon Postgres

    UI->>State: User Action (Type/Click)
    State->>State: Update State (Immediate)
    
    Note over UI, State: Hot Path (Sync)
    
    UI->>API: handleSave() (Checkpoint)
    API->>DB: INSERT/UPDATE jsonb
    DB-->>API: 200 OK
    API-->>UI: Toast "Saved"
```
