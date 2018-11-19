# Git Changelog Listener

Listen for file changes in your target path
Cron-driven changelog listener for git repositories

### Options

#### basePath

Type: `String`  
Default: `__dirname`

Set the git repository directory of where to run the listener.

#### interval

Type: `Number`  
Default: `1000`

**(Optional)** Set the interval of how often to check for changes.



### Example


```js
const Changelog = require('git-changelog-listener');

const listener = new Changelog({
    interval: 1000, // defaults to 1000ms if not defined
    basePath: '/path/to/my/repo' // basePath
});

listener.onChange((info) => {
    console.log('information here >>', info);
});
```
