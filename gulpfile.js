"use strict";

var gulp = require('gulp');
var ts = require('gulp-typescript');
var mocha = require('gulp-mocha');
var merge = require('merge2');
var gulpTypings = require("gulp-typings");


gulp.task('typings', function (callback) {
    gulp.src("./typings.json").pipe(gulpTypings());
});

var tsProject = ts.createProject('tsconfig.json');
gulp.task('tsc', ["typings"], function () {
    var tsResult = tsProject.src().pipe(ts(tsProject));

    return merge([
        tsResult.dts.pipe(gulp.dest('build/definitions')),
        tsResult.js.pipe(gulp.dest('build/js'))
    ]);
});

gulp.task("tests", ["tsc"], function () {
    return gulp.src('build/js/test/**/*.js', {read: false}).pipe(mocha());
});