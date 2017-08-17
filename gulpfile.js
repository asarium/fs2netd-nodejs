"use strict";

const gulp = require('gulp');
const ts = require('gulp-typescript');

const tsProject = ts.createProject('tsconfig.json', {
    "rootDir": "."
});
gulp.task('tsc', () => {
    const tsResult = tsProject.src().pipe(tsProject());

    return tsResult.js.pipe(gulp.dest('build'));
});

gulp.task("tslint", () => {
    const tslint = require("gulp-tslint");

    tsProject.src().pipe(tslint({
        formatter: "verbose"
    })).pipe(tslint.report())
});

gulp.task("test", ["tsc"], () => {
    const mocha = require('gulp-mocha');

    return gulp.src('build/test/**/*.js', {read: false}).pipe(mocha());
});

gulp.task("deploy", ["tsc"], () => {
    return [
        gulp.src("build/src/**/*.js").pipe(gulp.dest("deploy/src")),
        gulp.src("config/**/*").pipe(gulp.dest("deploy/config")),
        gulp.src("public/**/*").pipe(gulp.dest("deploy/public")),
        gulp.src("node_modules/**/*").pipe(gulp.dest("deploy/node_modules")),
        gulp.src("views/**/*").pipe(gulp.dest("deploy/views"))
    ];
});

gulp.task("default", ["tsc", "test", "deploy", "tslint"]);