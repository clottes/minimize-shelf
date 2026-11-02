all: pack install

pack:
	gnome-extensions pack --force --extra-source=utils

install:
	gnome-extensions install --force minimize-shelf@clottes.shell-extension.zip
	gnome-extensions enable minimize-shelf@clottes

prefs:
	gnome-extensions prefs minimize-shelf@clottes

clean:
	gnome-extensions disable minimize-shelf@clottes
	gnome-extensions uninstall minimize-shelf@clottes
	rm minimize-shelf@clottes.shell-extension.zip
