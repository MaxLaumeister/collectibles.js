var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify-es').default;
var svgo = require('gulp-svgo');
var sourcemaps = require('gulp-sourcemaps');
var header = require('gulp-header');
var spawn = require('child_process').spawn;
var plumber = require('gulp-plumber');

var pkg = require('./package.json');
var banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''].join('\n');

function sass_task(minify) {
  gulp.src(['node_modules/microtip/microtip.css', 'src/main.scss', 'src/theme-*.scss'])
  .pipe(plumber())
  .pipe(concat('collectibles.min.css'))
  .pipe(sass({outputStyle: minify? 'compressed' : 'expanded'}))
  .pipe(header(banner, { pkg : pkg } ))
  .pipe(gulp.dest('dist'))
}

gulp.task('sassdev', function() {
  sass_task(false);
});

gulp.task('sassmin', function() {
  sass_task(true);
});

var jsfiles = ['node_modules/web-animations-js/web-animations.min.js', 'node_modules/secrets.js-grempe/secrets.js', 'src/*.js'];

gulp.task('jsdev', function() {
  gulp.src(jsfiles)
  .pipe(plumber())
  .pipe(sourcemaps.init())
    .pipe(concat('collectibles.min.js'))
    .pipe(header(banner, { pkg : pkg } ))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('dist'))
});

gulp.task('jsmin', function() {
  gulp.src(jsfiles)
  .pipe(plumber())
  .pipe(concat('collectibles.min.js'))
  .pipe(uglify())
  .pipe(header(banner, { pkg : pkg } ))
  .pipe(gulp.dest('dist'))
});

gulp.task('img', function() {
  gulp.src(['!src/img/*.svg', 'src/img/*'])
  .pipe(plumber())
  .pipe(gulp.dest('dist/img'))
  
  gulp.src('src/img/*.svg')
  .pipe(svgo())
  .pipe(gulp.dest('dist/img'))
});

gulp.task('npm', function (done) {
  spawn('npm', ['publish'], { stdio: 'inherit' }).on('close', done);
});

gulp.task('publish', ['default', 'npm']);

gulp.task('default', ['sassmin', 'jsmin', 'img']);
gulp.task('dev', ['sassdev', 'jsdev', 'img']);