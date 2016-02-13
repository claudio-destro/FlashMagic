var gulp = require('gulp');
var merge = require('merge2');
var mocha = require('gulp-mocha');
var rm = require('gulp-rm');
var ts = require('gulp-typescript');

var tsconfig = require('./tsconfig.json');

gulp.task('default', ['compile']);
gulp.task('dist', ['clean', 'compile', 'test']);

gulp.task('compile', function () {
  var ret = gulp
    .src(['src/**/*.ts', 'typings/main.d.ts'])
    .pipe(ts(tsconfig.compilerOptions));
  return merge([
    ret.dts.pipe(gulp.dest('lib/')),
    ret.js.pipe(gulp.dest('lib/')),
  ]);
});

gulp.task('clean', function () {
  return gulp
    .src(['lib/**/*', 'test/**/*Test.js'], { read: false })
    .pipe(rm({ async: false }));
});

gulp.task('test', ['compile'], function () {
  return gulp
    .src(['test/**/*Test.ts', 'typings/main.d.ts'])
    .pipe(ts(tsconfig.compilerOptions))
    .pipe(gulp.dest('test/'))
    .pipe(mocha());
});
