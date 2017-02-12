var gulp = require('gulp');
var connect = require('gulp-connect');

gulp.task('connect', function() {
    connect.server({
        port: 9000
    });
});

gulp.task('default', ['connect']);   