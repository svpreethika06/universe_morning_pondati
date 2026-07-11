# My Universe — Good Morning Wife Website

A cinematic, mobile-friendly love website that travels from a realistic rotating Earth to the Sun, through deep space, into a galaxy, and finally reveals:

**GOOD MORNING MY ONE AND ONLY WIFE**

## Main experience

- High-detail Earth with real day, city-light, normal, ocean-specular, and cloud maps
- Animated atmospheric glow, moving clouds, Sun surface, solar corona, nebulae, galaxy, stars, and particle heart
- Cinematic Earth → Sun → universe camera journey
- Warp-speed star streaks during travel
- Soft generated ambient space sound and transition chimes
- Drag or move to create subtle 3D parallax
- Tap empty areas to create touch stardust
- Final **touch-and-hold heart surprise**
- Heart and star celebration after the surprise unlocks
- Interactive button showing multiple heartfelt reasons she is loved
- Replay, skip, mute, loading progress, responsive layout, and reduced-motion support

## Files

```text
universe-wife-website/
├── index.html
├── styles.css
├── app.js
├── README.md
└── assets/
    ├── earth_atmos_2048.jpg
    ├── earth_clouds_1024.png
    ├── earth_lights_2048.png
    ├── earth_normal_2048.jpg
    └── earth_specular_2048.jpg
```

## Open the website

For the most reliable result, use VS Code with the **Live Server** extension:

1. Extract the ZIP.
2. Open the extracted folder in VS Code.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

Opening `index.html` directly may cause a browser to restrict local texture files. Live Server avoids that problem.

## Publish with GitHub Pages

1. Upload `index.html`, `styles.css`, `app.js`, `README.md`, and the complete `assets` folder to the root of the repository.
2. Open the repository **Settings**.
3. Select **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/root`, then save.

Do not upload only the ZIP file. The `assets` folder must remain beside the HTML, CSS, and JavaScript files.

## Personalise the love messages

Open `app.js` and search for:

```js
const reasons = [
```

Edit those sentences to add private memories, nicknames, or promises. The final main text can be edited in `index.html` inside the `final-message` section.

## Technical note

The website uses Three.js r128 and GSAP 3.12.5 from a CDN. Internet access is therefore required for the animation libraries and Google Fonts. The Earth texture files are included locally in the `assets` folder.


## Background music

The included file `assets/our-universe-music.mp3` starts when **Begin the journey** is tapped. It fades in gently, loops during the final interactive section, follows the sound on/off button, pauses when the browser tab is hidden, and restarts from the beginning when the cinematic journey is replayed.
