# SHRED — Progression Algorithm (Planned)

## Double Progression (Default)
```
Target rep range: 8-12 (hypertrophy) or 3-6 (strength)

Each session:
  if ALL sets completed at RPE ≤ 8 for 2 consecutive sessions:
    → Barbell/DB: +2.5kg
    → Bodyweight: +1 rep per set
    → If at top of rep range for 2 sessions: advance variation
  elif ALL sets completed but RPE 9-10:
    → Maintain, same target next time
  elif reps missed:
    → Repeat same prescription
  elif 4 sessions no progress → DELOAD: -10% volume
```

## Bodyweight Progression
```
When ALL sets hit max of rep range (e.g. 3×12) for 2 sessions:
  → Advance to next variation in progression chain
  → Reset reps to min of range (e.g. 8)
  → Log milestone

When unsuccessful at new variation (can't hit min reps):
  → Stay at previous variation, +1 extra set
  → Retry harder variation next cycle
```

## Muscle Recovery
- Track last trained date per muscle group
- Minimum 48h recovery enforced
- Auto-inferred training split based on history

## Calorie Auto-Calc (MET-based)
```
calories_burned = MET × weight_kg × duration_hours
MET lookup: bodyweight low=3.5, moderate=5.0, high=6.5, vigorous=8.0
User can override.
```

## Edge Case Flags
- Morning (<10:00): warn if pre-workout kcal > 500
- Evening (>17:00): warn if pre-workout kcal > 800

## Status
⚠️ Not yet implemented — planned for Phase 5
