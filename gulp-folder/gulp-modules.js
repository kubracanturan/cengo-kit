global.gulp = require('gulp');
global.gulpLoadPlugins = require('gulp-load-plugins');
global.browserSync = require('browser-sync');
global.del = require('del');
global.wiredep = require('wiredep').stream;
global.series = require('stream-series');
global.$ = gulpLoadPlugins();
global.reload = browserSync.reload;
global.rename = require('gulp-rename');
global.fs = require('fs');
