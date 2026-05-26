#!/usr/bin/env bash
# Run from repo root. Renders one or all stages of the LC300 360 explorer.
#
# Usage:
#   ./scripts/blender/render_stage.sh exterior
#   ./scripts/blender/render_stage.sh engine_approach
#   ./scripts/blender/render_stage.sh engine_bay
#   ./scripts/blender/render_stage.sh underneath
#   ./scripts/blender/render_stage.sh all
#
# Requires Blender 4.2+ on PATH and an OptiX-capable GPU (or runs slow on CPU).

set -euo pipefail
STAGE="${1:-all}"
BLEND="public/models/lc300-raw/lc300-working.blend"

if [ ! -f "$BLEND" ]; then
  echo "ERROR: $BLEND missing. Run Task 1.2 to produce it."
  exit 1
fi

# Resolve Blender executable: prefer $BLENDER env var, else PATH, else known install paths.
BLENDER="${BLENDER:-}"
if [ -z "$BLENDER" ]; then
  if command -v blender >/dev/null 2>&1; then
    BLENDER="blender"
  else
    for candidate in \
      "/c/Program Files/Blender Foundation/Blender 5.1/blender.exe" \
      "/c/Program Files/Blender Foundation/Blender 5.0/blender.exe" \
      "/c/Program Files/Blender Foundation/Blender 4.5/blender.exe" \
      "/c/Program Files/Blender Foundation/Blender 4.4/blender.exe" \
      "/c/Program Files/Blender Foundation/Blender 4.3/blender.exe" \
      "/c/Program Files/Blender Foundation/Blender 4.2/blender.exe" \
      "/c/Program Files/Blender Foundation/Blender/blender.exe" \
      "/Applications/Blender.app/Contents/MacOS/Blender" \
      "/usr/bin/blender"
    do
      if [ -f "$candidate" ]; then BLENDER="$candidate"; break; fi
    done
  fi
fi
if [ -z "$BLENDER" ]; then
  echo "ERROR: Blender not found. Set the BLENDER env var, e.g.:"
  echo "       BLENDER=\"/c/Program Files/Blender Foundation/Blender 5.1/blender.exe\" \\"
  echo "         bash scripts/blender/render_stage.sh $STAGE"
  exit 1
fi
echo "[render] using Blender: $BLENDER"

"$BLENDER" --background "$BLEND" \
           --python scripts/blender/render_stages.py \
           -- --stage "$STAGE"
