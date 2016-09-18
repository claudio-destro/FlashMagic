var gulp = require('gulp');
var merge2 = require('merge2');
var mocha = require('gulp-mocha');
var rm = require('gulp-rm');
var runSequence = require('run-sequence');
var ts = require('gulp-typescript');

var tsconfig = require('./tsconfig.json');

var typingsMain = 'typings/index.d.ts';

gulp.task('default', ['build']);

gulp.task('build', function () {
  var ret = gulp
    .src(['src/**/*.ts', typingsMain])
    .pipe(ts(tsconfig.compilerOptions));
  return merge2([
    ret.dts.pipe(gulp.dest('lib/')),
    ret.js.pipe(gulp.dest('lib/')),
  ]);
});

gulp.task('test', ['build'], function () {
  return gulp.src(['test/**/*Test.ts', typingsMain])
    .pipe(ts(tsconfig.compilerOptions))
    .pipe(gulp.dest('test/'))
    .pipe(mocha());
});

gulp.task('clean', function () {
  return gulp.src(['lib/**/*', 'test/**/*Test.js'], { read: false }).pipe(rm());
});

gulp.task('publish', function (cb) { runSequence('clean', 'build', cb); });
