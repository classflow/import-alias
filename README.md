# import-alias


## Usage

Add a comment to source files defining a unique alias.

*/foo/bar/baz/A.js*
```js
// @alias A
```


*/foo/B.js*
```js
// @alias B
```

Import aliased files by alias name.

*/a/b/c.js*
```js
import A from '@A';
import B from '@B';
```

Run `import-alias` to replace import statements with relative paths.

```sh
import-alias .
```

*/a/b/c.js*
```js
import A from '../../../foo/bar/baz/A'; // @A
import B from '../../../foo/B'; // @B
```

If you move aliased files, run `import-alias` again to update the paths.

```sh
mv /foo/bar/baz/A.js /some/new/path/A.js
import-alias .
```

*/a/b/c.js*
```js
import A from '../some/new/path/A'; // @A
import B from '../foo/B'; // @B
```







## notes
finds all js, jsx, and es6 files

---
kickstarted by [npm-boom][npm-boom]

[npm-boom]: https://github.com/reergymerej/npm-boom
