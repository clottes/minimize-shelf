# Minimize Shelf

Minimize Shelf is a lightweight GNOME Shell extension that shows the minimized windows of the **current workspace** as app icons in the top panel. Click an icon to restore its window.

- **UUID:** `minimize-shelf@clottes`
- **Supported shell versions:** 45 – 51 (see [`metadata.json`](../metadata.json)); tested on 46
- **Repository:** https://github.com/clottes/minimize-shelf — continued from [blfpd/minimize-shelf](https://github.com/blfpd/minimize-shelf) (Guillaume Pasquet, Baptiste Darthenay)
- **License:** GPL-3.0-only for the original code; new contributions are GPL-3.0-or-later (see the [README](../README.md#license)). Derived in part from the Simple Task Bar (fthx) and All Windows (lyonel) extensions.

How It Works
============================================================

The extension adds a single `St.BoxLayout` to the top panel and rebuilds its contents whenever the window or workspace state changes.

Panel Placement
---------------

The shelf goes into either the left or right panel box, depending on the `direction` setting:

| Side  | Panel box   | Insert index                     |
| ----- | ----------- | -------------------------------- |
| Left  | `_leftBox`  | `-1` (last item on the left)     |
| Right | `_rightBox` | `1` (first item on the right)    |

Refresh Triggers
----------------

`WindowList._updateMenu()` clears and rebuilds the shelf on these signals:

- `global.display`: `restacked`, `window-left-monitor`
- `global.workspace_manager`: `workspace-added`, `workspace-removed`, `active-workspace-changed`

Each rebuild lists the active workspace's windows and adds a 22 px app icon (`ICON_SIZE`) for each minimized one.

Click Behaviour
---------------

Clicking an icon calls `_activateWindow()`:

- If the window is already focused on the active workspace and the overview is closed, it minimizes again (toggle).
- Otherwise, it activates the window, closes the overview, and switches to the window's workspace unless the window is on all workspaces.

Minimize Animation
------------------

On every rebuild, each window on the workspace gets an icon geometry via `set_icon_geometry()`, so the minimize animation shrinks toward the shelf rather than toward the default location. The anchor x-position comes from `Direction.anchor()`:

- Left: `200` px
- Right: screen width minus `150` px

> ⚠️ **_WARN:_** These anchors are hard-coded approximations. They do not track the shelf's real position, so the animation target drifts when panel contents change width. [](#W)

Project Layout
============================================================

| File                                                                  | Purpose                                                               |
| --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`extension.js`](../extension.js)                                     | `WindowList` (the shelf) and the `Extension` enable/disable lifecycle |
| [`prefs.js`](../prefs.js)                                             | Adwaita preferences page with Left/Right toggle buttons               |
| [`utils/settings.js`](../utils/settings.js)                           | `Direction` class wrapping the GSettings `direction` key              |
| [`schemas/`](../schemas/)                                             | GSettings schema and its compiled `gschemas.compiled`                 |
| [`stylesheet.css`](../stylesheet.css)                                 | Icon styling (`.focused-app`)                                         |
| [`Makefile`](../Makefile)                                             | Pack, install, prefs and clean targets                                |
| [`.github/workflows/lint.yml`](../.github/workflows/lint.yml)         | ESLint on every push                                                  |

Settings
============================================================

The extension has a single setting, stored in schema `org.gnome.shell.extensions.minimize-shelf`:

| Key         | Type                  | Default | Effect                          |
| ----------- | --------------------- | ------- | ------------------------------- |
| `direction` | enum (`Left`/`Right`) | `Right` | Which side of the panel to use  |

Changing the setting takes effect immediately: the extension destroys the shelf and rebuilds it on the new side, without reloading the extension.

You can read or change it from the command line:

```shell
gsettings --schemadir schemas get org.gnome.shell.extensions.minimize-shelf direction
gsettings --schemadir schemas set org.gnome.shell.extensions.minimize-shelf direction Left
```

> 📎 [_NOTE:_](#.) After editing the schema XML, recompile it with `glib-compile-schemas schemas/`. The compiled file is committed to the repo.

Development
============================================================

> 📋 [](#steps) Run from the working copy by symlinking it into the extensions folder:

```shell
ln -s "$PWD" ~/.local/share/gnome-shell/extensions/minimize-shelf@clottes
```

Then restart GNOME Shell (below) and enable it:

```shell
gnome-extensions enable minimize-shelf@clottes
make prefs      # open the preferences window
```

Edits to the repo take effect on the next shell restart. GNOME Shell only scans for extensions at startup, and the link's directory name must match the `uuid` in `metadata.json`.

> ⚠️ **_WARN:_** Don't run `make` or `make install` while the symlink is in place. `gnome-extensions install --force` replaces it with an installed copy, and repo edits stop showing up. [](#W)

To build and install a zip instead:

```shell
make            # pack + install + enable
make clean      # disable, uninstall, remove the zip
```

`make pack` passes `--extra-source=utils` because `gnome-extensions pack` only includes top-level sources by default.

On X11, restart GNOME Shell with `Alt+F2`, then type `r` and press Enter. On Wayland, log out and back in, or test in a nested session:

```shell
dbus-run-session -- gnome-shell --nested --wayland    # GNOME 49+: gnome-shell --devkit
```

Follow the logs while testing:

```shell
journalctl -f -o cat /usr/bin/gnome-shell
```

Linting
-------

```shell
npm install
npm run lint -- .
```

Prettier settings live in [`package.json`](../package.json): single quotes, 4-space tabs, `arrowParens: avoid`, LF line endings.

Known Limitations
============================================================

- 🐞 **GNOME 44 and older are unsupported.** The code uses ES modules, `Mtk.Rectangle` and the `Extension` class, all of which need GNOME 45+.
- ⏳ **Only tested on GNOME 46.** 47 – 51 are listed because their porting guides show no breaking changes for the APIs used here.
- 💣 **`button-press-event` is deprecated in GNOME 51.** It still works, but a future release removes it in favour of `Clutter.ClickGesture`.
- 🐞 **Animation anchor is approximate.** See [Minimize Animation](#minimize-animation).
- ⛏️ **Dead code.** `_activateWorkspace()` in `extension.js` is never called, and `.hidden-app` in `stylesheet.css` is unused.

Todo
============================================================

- [x] 📦 Port to ES modules for GNOME 45+ (`Mtk.Rectangle`, replace `add_actor()`)
- [x] ⚙️ Apply a `direction` change without reloading the extension
- [ ] ⏳ Test on GNOME 47 – 51 (VM or GNOME OS image)
- [ ] 🔧 Replace `button-press-event` with `Clutter.ClickGesture` before it's removed
- [ ] 🔧 Derive the minimize animation anchor from the shelf's real position instead of hard-coded offsets
- [ ] 🗑️ Remove `_activateWorkspace()` and the unused `.hidden-app` style
- [x] 📦 Sync `package.json` version with `metadata.json`
- [x] 📝 Update the `metadata.json` description to mention the panel-side setting

- - -

📚 references:

- https://github.com/clottes/minimize-shelf
- https://github.com/blfpd/minimize-shelf (original, inactive since 2022-12)
- https://gjs.guide/extensions/
