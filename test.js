/*eslint-env es6, node */
'use strict';

const App = require('./index');

const listener = new App({
    // repository path
    //basePath: './'
});

listener.onChange((eventInfo) => {
    console.log('it changed!', eventInfo);
});
