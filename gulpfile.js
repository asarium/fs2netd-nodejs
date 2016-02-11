"use strict";

var gulp = require('gulp');
var ts = require('gulp-typescript');
var mocha = require('gulp-mocha');
var merge = require('merge2');

var tsProject = ts.createProject('tsconfig.json');

gulp.task('scripts', function () {
    var tsResult = tsProject.src().pipe(ts(tsProject));

    return merge([
        tsResult.dts.pipe(gulp.dest('build/definitions')),
        tsResult.js.pipe(gulp.dest('build/js'))
    ]);
});

gulp.task("tests", ["scripts"], function () {
    return gulp.src('build/js/test/**/*.js', {read: false}).pipe(mocha());
});