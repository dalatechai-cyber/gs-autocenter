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

blender --background "$BLEND" \
        --python scripts/blender/render_stages.py \
        -- --stage "$STAGE"
