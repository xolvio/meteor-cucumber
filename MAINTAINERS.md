## Release

You need to update NPM before you can release:

```sh
cd ~/.meteor/packages/meteor-tool/1.1.4/mt-*/dev_bundle/lib
../bin/npm install npm
```

Then `meteor publish`.

You need to build the package on the Mac OS X and Linux 64bit build machine.

```sh
meteor admin get-machine os.linux.x86_64 --minutes 10
meteor admin get-machine os.osx.x86_64 --minutes 10
```

You need to also update npm on the build machine before you execute the build command.
