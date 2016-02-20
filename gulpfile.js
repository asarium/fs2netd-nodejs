"use strict";

var gulp = require('gulp');
var ts = require('gulp-typescript');
var mocha = require('gulp-mocha');
var gulpTypings = require("gulp-typings");


gulp.task('typings', function () {
    return gulp.src("./typings.json").pipe(gulpTypings());
});

var tsProject = ts.createProject('tsconfig.json');
gulp.task('tsc', ["typings"], function () {
    var tsResult = tsProject.src().pipe(ts(tsProject));

    return tsResult.js.pipe(gulp.dest('build'));
});

gulp.task("tests", ["tsc"], function () {
    return gulp.src('build/test/**/*.js', {read: false}).pipe(mocha());
});

gulp.task("deploy", ["tsc"], function () {
    return [
        gulp.src("build/src/**/*.js").pipe(gulp.dest("deploy/src")),
        gulp.src("config/**/*").pipe(gulp.dest("deploy/config")),
        gulp.src("public/**/*").pipe(gulp.dest("deploy/public")),
        gulp.src("node_modules/**/*").pipe(gulp.dest("deploy/node_modules"))
    ];
});