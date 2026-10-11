╔══════════════════════════════════════════════════════════════╗
║ STAGE 6 HANDOFF REPORT — Security Validation (SOFT GATE)     ║
╠══════════════════════════════════════════════════════════════╣
║ Started:   <missing>                                         ║
║ Completed: <missing>                                         ║
║ Elapsed:   <missing>                                         ║
║                                                              ║
║ Soft-gate validator: FAC-S6-001..006 - PASSED                ║
║ Advisory severity:   NONE                                    ║
║                                                              ║
║ Classification context:                                      ║
║   - Level:      Protected B                                  ║
║   - Categories: Other                                        ║
║                                                              ║
║ Artifacts written (0):                                       ║
╠══════════════════════════════════════════════════════════════╣
║ Stage 6 is the SOFT-GATE closeout — FAIL findings            ║
║ surface as ADVISORY in factory-manifest.json but             ║
║ do NOT block manifest production.                            ║
╠══════════════════════════════════════════════════════════════╣
║ Next step: Stage 7 (Test & Quality) — REQUIRED before        ║
║ the manifest. Stage 6 does not finalize the pipeline.        ║
║ >> WAITING FOR USER CONFIRMATION TO PROCEED TO STAGE 7 <<    ║
╚══════════════════════════════════════════════════════════════╝

Drift warnings (non-blocking, exit 3):
  - stageHistory entry missing startedAt — dispatcher should overwrite the finalize_stage.py placeholder with the actual cycle-start timestamp
  - stageHistory entry has empty artifactsWritten[] — dispatcher should overwrite the finalize_stage.py placeholder with the actual artifact list
