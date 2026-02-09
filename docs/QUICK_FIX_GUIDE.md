# 🔧 Quick Fix Guide - Rock.json Errors

## Summary
3 melody entries in `rock.json` have step numbers that exceed the 32-step pattern length.

---

## Error Details

### Pattern Length Rules
- **16-step pattern**: Valid steps are 0-15 (16 total steps)
- **32-step pattern**: Valid steps are 0-31 (32 total steps)
- **64-step pattern**: Valid steps are 0-63 (64 total steps)

**The issue**: Some 32-step patterns have entries for steps 32 and 33, which are outside the valid range (0-31).

---

## Fix #1: Stairway to Heaven (32-step variation)

**Location**: `rock.json` → `song_variations` → `stairway-to-heaven` → Array index [1] → `melody`

**Current (WRONG)**:
```json
"melody": {
  "0-0": true,
  "2-1": true,
  ...
  "30-6": true,
  "32-7": true  // ❌ INVALID: Step 32 exceeds pattern length of 32
}
```

**Option A - Delete the invalid entry**:
```json
"melody": {
  "0-0": true,
  "2-1": true,
  ...
  "30-6": true
  // Removed "32-7"
}
```

**Option B - Move to last valid step**:
```json
"melody": {
  "0-0": true,
  "2-1": true,
  ...
  "30-6": true,
  "31-7": true  // ✅ VALID: Moved to step 31
}
```

**Recommendation**: Use Option B to preserve the note

---

## Fix #2: We Will Rock You (32-step variation)

**Location**: `rock.json` → `song_variations` → `we-will-rock-you` → Array index [1] → `melody`

**Current (WRONG)**:
```json
"melody": {
  "0-0": true,
  "1-1": true,
  "2-2": true,
  ...
  "31-7": true,
  "32-0": true,  // ❌ INVALID: Step 32 exceeds pattern length
  "33-1": true   // ❌ INVALID: Step 33 exceeds pattern length
}
```

**Option A - Delete both invalid entries**:
```json
"melody": {
  "0-0": true,
  "1-1": true,
  "2-2": true,
  ...
  "31-7": true
  // Removed "32-0" and "33-1"
}
```

**Option B - Move to earlier valid steps**:
```json
"melody": {
  "0-0": true,
  "1-1": true,
  "2-2": true,
  ...
  "29-5": true,  // Add earlier if needed
  "30-0": true,  // Alternative placement
  "31-7": true   // Already exists
  // Removed "32-0" and "33-1"
}
```

**Recommendation**: Use Option A (delete) since step 31 already has a note

---

## Step-by-Step Fix Instructions

### Manual Edit Method

1. Open `rock.json` in a text editor
2. Search for `"stairway-to-heaven"`
3. Find the second variation (index [1], the 32-step version)
4. In the melody section, find `"32-7": true`
5. Either:
   - Delete the line entirely, OR
   - Change to `"31-7": true`
6. Search for `"we-will-rock-you"`
7. Find the second variation (index [1], the 32-step version)
8. In the melody section, find and DELETE both:
   - `"32-0": true,`
   - `"33-1": true`
9. Save the file
10. Re-run validation

### Python Script Method

```python
import json

# Load the file
with open('rock.json', 'r') as f:
    data = json.load(f)

# Fix Stairway to Heaven
stairway = data['song_variations']['stairway-to-heaven'][1]
if '32-7' in stairway['melody']:
    del stairway['melody']['32-7']
    stairway['melody']['31-7'] = True  # Optional: move to step 31

# Fix We Will Rock You
we_will = data['song_variations']['we-will-rock-you'][1]
if '32-0' in we_will['melody']:
    del we_will['melody']['32-0']
if '33-1' in we_will['melody']:
    del we_will['melody']['33-1']

# Save the fixed file
with open('rock_fixed.json', 'w') as f:
    json.dump(data, f, indent=2)

print("✅ Fixes applied! Saved to rock_fixed.json")
```

---

## Validation After Fix

After making the changes, validate with:

```python
import json

with open('rock_fixed.json', 'r') as f:
    data = json.load(f)

# Check Stairway to Heaven
stairway_32 = data['song_variations']['stairway-to-heaven'][1]
melody_steps = [int(k.split('-')[0]) for k in stairway_32['melody'].keys()]
max_step = max(melody_steps)
print(f"Stairway - Max step: {max_step} (should be ≤31)")
assert max_step < 32, "Still has invalid steps!"

# Check We Will Rock You
we_will_32 = data['song_variations']['we-will-rock-you'][1]
melody_steps = [int(k.split('-')[0]) for k in we_will_32['melody'].keys()]
max_step = max(melody_steps)
print(f"We Will Rock You - Max step: {max_step} (should be ≤31)")
assert max_step < 32, "Still has invalid steps!"

print("\n✅ All fixes validated successfully!")
```

---

## Expected Result

**Before Fix**: 3 errors  
**After Fix**: 0 errors  
**Accuracy**: 100%

---

## Impact Assessment

### Low Impact
- Only affects 2 songs out of 280
- Only affects 32-step variations
- 16-step and 64-step variations are unaffected
- Other 278 songs are completely valid

### No Breaking Changes
- File structure remains identical
- Other songs unaffected
- Pattern format unchanged
- Backward compatible

### Musical Impact
- Minimal: Removing or moving 3 notes won't significantly change the songs
- Both songs will still play correctly
- The musical idea is preserved

---

## Checklist

- [ ] Open rock.json
- [ ] Fix Stairway to Heaven: Remove/move "32-7"
- [ ] Fix We Will Rock You: Remove "32-0" and "33-1"
- [ ] Save file
- [ ] Run validation script
- [ ] Confirm 0 errors
- [ ] Deploy updated file

---

**Estimated Time**: 5 minutes  
**Difficulty**: Easy  
**Risk**: Very Low
