var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify-es').default;
var svgo = require('gulp-svgo');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('sass', function() {
  gulp.src(['node_modules/microtip/microtip.css', 'src/*.css'])
  .pipe(concat('collectibles.min.css'))
  .pipe(sass({outputStyle: 'compressed'}))
  .pipe(gulp.dest('dist'))
});

gulp.task('js', function() {
  gulp.src(['node_modules/web-animations-js/web-animations.min.js', 'node_modules/secrets.js-grempe/secrets.js', 'src/*.js'])
  .pipe(concat('collectibles.min.js'))
  .pipe(sourcemaps.init())
    .pipe(uglify())
   .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('dist'))
});

gulp.task('img', function() {
    gulp.src(['img/*', '!img/*.svg'])
    .pipe(gulp.dest('dist/img'))
    
    gulp.src('img/*.svg')
    .pipe(svgo())
    .pipe(gulp.dest('dist/img'))
});

gulp.task('default', ['sass', 'js', 'img']);