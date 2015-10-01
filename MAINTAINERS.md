## Release

First `meteor publish`.

Then you need to build the package on all architectures.

```sh
meteor admin get-machine os.osx.x86_64 --minutes 10
meteor admin get-machine os.linux.x86_64 --minutes 10
meteor admin get-machine os.linux.x86_32 --minutes 10
meteor admin get-machine os.windows.x86_32 --minutes 10
```

```sh
meteor publish-for-arch xolvio:cucumber@X.X.X
```
