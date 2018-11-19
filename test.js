/*eslint-env es6, node */
'use strict';

const App = require('./index');

const test = new App({
    // repository path
    basePath: './'
});

test.onChange((eventInfo) => {
    console.log('it changed!', eventInfo);
});
