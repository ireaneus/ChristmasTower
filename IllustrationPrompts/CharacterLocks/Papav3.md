# 🎨 Character Lock: Papa v3.0

**Style**

Classic Disney-style 2D animation with a touch of realism: rich hand-painted colors, clean outlines, expressive eyes, warm background tones, and soft lighting.

**Likeness Reference (HARD LOCK)**

Use **`Papa.svg`** and **`Papa-face.svg`** as the sole likeness references. Preserve the exact face proportions, hairline, **goatee + mustache shape**, skin tone, height, and body proportions. If any default conflicts arise, **the SVGs win**.

---

## Appearance

* **Age:** Late 50s to early 60s — energetic, not frail.
* **Height:** **5′7″** (tallest family member).
* **Build:** **Sturdy/medium** with **broad shoulders and chest**; **visible torso thickness** and **solid forearms**.
* **Face (overall):** **Rounder**, fuller cheeks with soft smile lines; **softer jaw** with a gentle under-chin fullness (submental curve)—not a sharp, V-shaped chin.
* **Hair:** Short, scruffy **white/light-gray** (tufts visible at sideburns and hat edge).
* **Eyes:** **Blue**, slightly squinty; lower lids softened; crow’s-feet hinted in smiles.
* **Expression:** Warm, approachable, steady; smiles more with the eyes than with a wide mouth.

---

## Face Geometry Lock (from `Papa-face.svg`)

> These are **shape constraints** the renderer must hit; do not “interpret.”

* **Head silhouette:** Horizontal oval with **cheek width ≈ forehead width (+/- 5%)**; **no tapered V-jaw**.
* **Cheeks:** **Full/rounded**; cheek prominence visible in ¾ view; nasolabial lines **soft**, never deep.
* **Jaw/Chin:** **Soft, rounded jaw**; **chin is short and broad** (no point). A **subtle under-chin fullness** should remain even when smiling.
* **Nose:** Medium-broad bridge with a **rounded tip**; **alae** (nostril wings) gently flared; no sharp/cartoon triangle.
* **Eyes:** Almond/oval with a **slight upper-lid hood**; **inter-ocular distance ≈ one eye-width**; lower lids soft.
* **Brows:** Low, relaxed arc; **do not raise** into high arches.
* **Mouth:** Medium width; **corners relax upward slightly**; upper lip thinner than lower; smile lines soft.
* **Ears:** Top aligns near brow line; lobes visible; keep ear depth modest.

### Facial Hair (HARD LOCK — from `Papa-face.svg`)

* **Style:** **Goatee + mustache ONLY** — **never** a full beard, chin curtain, or cheek whiskers.
* **Mustache:** Full but tidy; sits **just over the upper lip**, slight down-slope at outer thirds; **does not connect** as a full circle beard.
* **Goatee:** **Rounded-triangle** footprint centered on chin; **soft lower edge**, not a sharp point; width stays within the mouth corners.
* **Sideburns:** Short, trimmed; **do not** extend into cheek beard.
* **Color/Value:** Match the **white/light-gray** hair value family (slightly darker than scalp hair for readable silhouette).

---

## Clothing (LOCK)

* **Hat:** **Brown cowboy hat** with gentle brim curve.
* **Bandana:** **Red with subtle white pattern**, **knot behind the neck**, triangular **point draped forward** to cover the front of the neck/upper chest.
* **Shirt:** Dark gray/black **plaid flannel**.
* **Pants:** Blue jeans.
* **Boots:** Cowboy boots.

---

## Key Traits

* Warm, steady, protective; calm guide for the children.
* Posture relaxed but grounded; gestures open-handed and welcoming.

---

## Negative Constraints (Hard)

* ❌ **No full beard** (ever).
* ❌ **No** red/blond hair tones; hair and facial hair **must** read **white/light-gray**.
* ❌ **No** thin, V-shaped jaw or long pointed chin — keep the **rounder, fuller face**.
* ❌ **Do not** raise brows into a surprised/arched look.
* ❌ **Do not** remove or re-tie the bandana incorrectly (knot must be **behind**, point **forward**).

---

## Render Checks (Pass/Fail)

1. **Face silhouette** reads **rounder/full** (not tapered).
2. **Goatee + mustache only**; no cheek beard; sideburns short.
3. **Bandana**: knot **behind**, **triangular drape forward**.
4. **Eye spacing ≈ one eye-width**, blue eyes slightly squinty.
5. **Build** reads **sturdy** (broad chest/shoulders); not slim or frail.

---

## Scene Control Example

[Scene] Papa stands a half-step ahead of the children in soft golden forest light, palm open as he gestures gently. Face reads **full-cheeked and sturdy**, with the **goatee + mustache** silhouette crisp; **bandana** knot behind/point forward, plaid shirt and hat per lock.

---
