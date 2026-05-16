# Running the Blender prep scripts — for someone who has never opened Blender

These steps take a 40 MB raw car model and produce a small, properly-named,
properly-textured car model the website can load. You do not need to know any
3D modeling. You will click roughly five buttons.

You'll do this twice — once for the LC200, once for the LX570 — using the two
script files in this folder: `prep_lc200.py` and `prep_lx570.py`.

---

## 0. Before you start: check the files

Open File Explorer and go to:

```
C:\gs website\gs-autocenter\public\models\
```

You should see four files in there:

- `lc200.glb` — the raw LC200 model (about 40 MB)
- `lx570.glb` — the raw LX570 model (about 31 MB)
- `prep_lc200.py` — the Blender script for the LC200
- `prep_lx570.py` — the Blender script for the LX570

If `lc200.glb` or `lx570.glb` is missing, stop and re-download them first.
The scripts won't have anything to work with.

---

## 1. Install Blender (skip if you already have it)

1. Open a browser and go to **https://www.blender.org/download/**.
2. Click the big blue **Download Blender** button. Run the installer with all
   defaults — just keep clicking Next.
3. When it finishes, Blender will be in your Start menu.

The version doesn't matter much. Anything from Blender 3.6 onward will work.

---

## 2. Open Blender

Find **Blender** in your Start menu and click it. The first time it opens you
might see a small "Quick Setup" window — just click anywhere outside it to
dismiss it.

You will then see the default Blender screen: a grey 3D view with a cube in
the middle. This is fine. **Leave the cube alone** — the script clears it
automatically.

---

## 3. Switch to the Scripting workspace

Look at the **very top** of the Blender window. There's a horizontal bar of
words that includes:

```
Layout    Modeling    Sculpting    UV Editing    Texture Paint
Shading   Animation   Rendering    Compositing   Geometry Nodes
Scripting     +
```

Click **Scripting**. The whole window now changes layout: you'll see a
**text editor** in the upper half and a **Python console + info log** in the
lower half. This is where the script will run.

> **If you don't see "Scripting":** the Blender window might be too narrow.
> Maximize it, or scroll the tab bar with your mouse wheel.

---

## 4. Open the script

In the Scripting workspace, the text editor on the top is empty by default
and shows a small toolbar with the words `New` and `Open`.

1. Click **Open**.
2. A file picker appears. Navigate to:

   ```
   C:\gs website\gs-autocenter\public\models\
   ```

3. Click on **`prep_lc200.py`** (or `prep_lx570.py`, depending on which
   model you're preparing).
4. Click the **Open Text Block** button in the bottom-right of the picker.

The script body now appears in the text editor — lots of Python code starting
with `"""prep_lc200.py - Blender prep script for the LC200 GLB"""`.

---

## 5. Turn on the System Console (Windows only — strongly recommended)

This shows you the script's diagnostic output while it runs. Without it you
can't see the triangle counts or the rename log.

1. In the top-left menu of Blender, click **Window**.
2. Click **Toggle System Console**.

A black terminal window pops up. Leave it open — don't close it. Position it
next to Blender so you can see both at once.

---

## 6. Run the script

Look at the toolbar above the script text. There's a **▶ Run Script** button
(it looks like a play / triangle icon). Click it.

The keyboard shortcut is **Alt + P** if your mouse hovers over the text
editor area.

What happens next:

- The black System Console fills with progress lines: import, diagnostics,
  rename log, decimation, material checks, export.
- The 3D viewport shows the imported car for a moment (might be invisible
  because of camera position — that's fine).
- The whole pipeline takes anywhere from **30 seconds to 5 minutes**
  depending on your computer. The LC200 (1.18 million triangles) is the
  slow one.
- When it finishes you'll see this in the console:
  ```
  ==============================================================================
  PIPELINE COMPLETE
  ==============================================================================
  ```

> **If nothing seems to happen:** look at the console. If you see a Python
> error in red, copy the whole error and ask for help. Most common cause:
> the `SOURCE_GLB` path at the top of the script is wrong because you moved
> the project folder.

---

## 7. Find the output file

Go back to File Explorer at:

```
C:\gs website\gs-autocenter\public\models\
```

You'll now see a new file:

- After `prep_lc200.py` runs: **`lc200-ready.glb`** (typically 8–15 MB)
- After `prep_lx570.py` runs: **`lx570-ready.glb`** (typically 6–12 MB)

If the `-ready.glb` file is missing, the script failed before reaching the
export step — check the System Console for errors.

---

## 8. Do it again for the second model

1. Inside Blender, on the script tab toolbar, click the small **X** next to
   the script name. (You're closing the text block, not Blender.)
2. Click **Open** again, pick the **other** script file.
3. Click **▶ Run Script** again.

You now have both `lc200-ready.glb` and `lx570-ready.glb` sitting in the
models folder. These are the files the website will load.

---

## 9. Close Blender

Just close the window. **Do not save** if it asks — there's nothing to save,
the script wrote what it needed to write directly to disk.

---

## What the script actually did

For each model, in order:

1. Cleared Blender's default cube/light/camera scene.
2. Imported the raw 40 MB / 31 MB GLB.
3. Printed every mesh's name, triangle count, position, and size to the
   console (this is your inventory).
4. Auto-separated any single welded mesh into its loose parts (skipped for
   our two files because they're already over-fragmented).
5. Renamed meshes to readable labels — `Hood`, `Door_FL`, `Wheel_FR`,
   `Headlight`, `Bumper_F`, `Steering_Wheel`, and so on — based on
   keyword hints in the original names and on 3D position.
6. If the total was over 150 000 triangles, applied a Decimate modifier with
   per-part tuning: **light decimation** on the click-targets (hood, doors,
   bumper, headlights), **heavy decimation** on the underside / chassis the
   visitor never sees.
7. Made sure every mesh has a Principled BSDF material — paint, glass,
   chrome, rubber, plastic, or emissive light — so it renders correctly in
   Three.js on the website.
8. Exported the final result to `…-ready.glb` with **Draco mesh
   compression** so the file is small enough to download over the internet.

The console output is your audit trail. Scroll back through it any time you
want to see what was renamed to what.

---

## Re-running is safe

The scripts always start by clearing the scene, so you can run them as many
times as you want. They never modify the source `lc200.glb` or `lx570.glb` —
only the `-ready.glb` outputs.

If you change the script (for example to fix a wrong rename) and run it
again, the new `-ready.glb` overwrites the previous one.

---

## Heads-up on the LC200 file

The Session 6 inspector found that **`lc200.glb` is not actually a Toyota
Land Cruiser 200**. The internal data identifies the source asset as
`Porsche_Macan_LOD_A.fbx` — DR1KING100K mis-labelled it on Sketchfab. The
script will still process it correctly, but the resulting 3D model the
visitor sees will look like a Porsche Macan, not a Land Cruiser.

If that matters, swap in a real LC200 GLB before running and re-run the
script. The script doesn't care what the source vehicle is, as long as it's
a GLB.
