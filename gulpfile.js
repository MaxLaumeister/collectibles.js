var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify-es').default;
var svgo = require('gulp-svgo');
var sourcemaps = require('gulp-sourcemaps');
var header = require('gulp-header');
var spawn = require('child_process').spawn;

var pkg = require('./package.json');
var banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''].join('\n');

gulp.task('sass', function() {
  gulp.src(['node_modules/microtip/microtip.css', 'src/*.css'])
  .pipe(concat('collectibles.min.css'))
  .pipe(sass({outputStyle: 'compressed'}))
  .pipe(header(banner, { pkg : pkg } ))
  .pipe(gulp.dest('dist'))
});

gulp.task('js', function() {
  gulp.src(['node_modules/web-animations-js/web-animations.min.js', 'node_modules/secrets.js-grempe/secrets.js', 'src/*.js'])
  .pipe(concat('collectibles.min.js'))
  .pipe(sourcemaps.init())
    .pipe(uglify())
  .pipe(header(banner, { pkg : pkg } ))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('dist'))
});

gulp.task('img', function() {
    gulp.src(['!src/img/*.svg', 'src/img/*'])
    .pipe(gulp.dest('dist/img'))
    
    gulp.src('src/img/*.svg')
    .pipe(svgo())
    .pipe(gulp.dest('dist/img'))
});

gulp.task('npm', function (done) {
  spawn('npm', ['publish'], { stdio: 'inherit' }).on('close', done);
});

gulp.task('publish', ['default', 'npm']);

gulp.task('default', ['sass', 'js', 'img']);